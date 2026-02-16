from sqlalchemy.orm import Session
import models
from services.gemini_client import GeminiClient
from typing import List, Optional

class DiscussionService:
    def __init__(self, db: Session):
        self.db = db

    def get_debate_context(self, debate_id: int) -> List[models.DebateTurn]:
        return self.db.query(models.DebateTurn).filter(models.DebateTurn.debate_id == debate_id).order_by(models.DebateTurn.timestamp).all()

    def generate_ai_turn(self, debate_id: int, participant_id: int) -> models.DebateTurn:
        debate = self.db.query(models.Debate).filter(models.Debate.id == debate_id).first()
        participant = self.db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        
        # Build context from previous turns
        turns = self.get_debate_context(debate_id)
        
        # If no turns yet, start with the topic
        if not turns:
            context = f"Topic: {debate.topic}\nPlease start the discussion."
        else:
            # Simple context: "Participant X said: ...\nParticipant Y said: ..."
            context_pieces = []
            for turn in turns:
                name = "User" if turn.turn_type == "USER" else (turn.participant.name if turn.participant else "System")
                context_pieces.append(f"{name}: {turn.content}")
            context = "\n".join(context_pieces)
            context += f"\nNow it's {participant.name}'s turn. Please respond."

        # Initialize Gemini Client for this participant
        client = GeminiClient(
            config=debate.config,
            system_instruction=participant.system_instruction
        )
        
        # We need to feed existing history to the chat object if we want it to be truly stateful, 
        # but for simplicity in this web version, we append the summary to the last message or use the accumulated context.
        # Here we use the accumulated context as a single prompt for now.
        response_text = client.send_message(context)

        # Save turn to DB
        db_turn = models.DebateTurn(
            debate_id=debate_id,
            participant_id=participant_id,
            content=response_text,
            turn_type="AI"
        )
        self.db.add(db_turn)
        self.db.commit()
        self.db.refresh(db_turn)
        return db_turn

    def inject_user_message(self, debate_id: int, content: str) -> models.DebateTurn:
        db_turn = models.DebateTurn(
            debate_id=debate_id,
            content=content,
            turn_type="USER"
        )
        self.db.add(db_turn)
        self.db.commit()
        self.db.refresh(db_turn)
        return db_turn
