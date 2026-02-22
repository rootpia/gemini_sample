from sqlalchemy.orm import Session
import models
from services.gemini_client import GeminiClient
from typing import List, Optional

class DiscussionService:
    def __init__(self, db: Session):
        self.db = db

    def get_debate_context(self, debate_id: int) -> List[models.DebateTurn]:
        return self.db.query(models.DebateTurn).filter(models.DebateTurn.debate_id == debate_id).order_by(models.DebateTurn.id).all()

    def generate_ai_turn(self, debate_id: int, participant_id: Optional[int] = None) -> models.DebateTurn:
        debate = self.db.query(models.Debate).filter(models.Debate.id == debate_id).first()
        
        participant = None
        if participant_id:
            participant = self.db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        
        # Build context from previous turns
        turns = self.get_debate_context(debate_id)
        
        # Pure context: topic followed by history transcript
        context = f"{debate.topic}\n\n"
        context_pieces = []
        for turn in turns:
            name = turn.participant.name if turn.participant else ("User" if turn.turn_type == "USER" else "System")
            context_pieces.append(f"{name}: {turn.content}")
        
        context += "\n".join(context_pieces)

        # Initialize Gemini Client
        if participant:
            temperature = getattr(participant, "temperature", 1.0)
            # Add trailing marker to the context to guide completion
            context += f"\n{participant.name}: "
            
            # Use user-registered strings with minimal task-level constraints
            system_instruction = (
                f"あなたはディベート参加者の「{participant.name}」です。\n"
                f"【役割】{participant.role}\n"
                f"【個別指示】\n{participant.system_instruction}\n\n"
                "他の参加者に問いかけをせず、自身の主張のみを述べてください。回答は自身の名前を含めず、発言内容のみを返してください。"
            )
        else:
            # Minimal System AI Moderator settings
            temperature = 0.7
            system_instruction = (
                "System\n"
                "Moderator\n"
                "あなたはプロの議論モデレーター「System」です。ユーザーからの介入内容に対し、中立かつ丁寧に応答し、議論を円滑に進める役割を担います。"
                "回答は常に簡潔で、議論の文脈を考慮したものにしてください。"
            )
        
        client = GeminiClient(
            config={**debate.config, "temperature": temperature},
            system_instruction=system_instruction
        )
        
        try:
            response_text = client.send_message(context)
        except Exception as e:
            # Save error as SYSTEM turn
            error_msg = f"Gemini API Error: {str(e)}"
            db_err_turn = models.DebateTurn(
                debate_id=debate_id,
                content=error_msg,
                turn_type="SYSTEM"
            )
            self.db.add(db_err_turn)
            self.db.commit()
            raise e

        # Calculate current AI participation count to find the index in participant_order
        participant_ai_turns = self.db.query(models.DebateTurn).filter(
            models.DebateTurn.debate_id == debate_id,
            models.DebateTurn.turn_type == "AI",
            models.DebateTurn.participant_id != None
        ).count()

        # Auto-nulling logic: remove participant from order after they speak
        # Skip for System turns (participant_id is None)
        if participant_id is not None:
            current_idx = participant_ai_turns
            if debate.participant_order and current_idx < len(debate.participant_order):
                # Create a new list to ensure SQLAlchemy detects the change in JSON field
                new_order = list(debate.participant_order)
                new_order[current_idx] = None
                debate.participant_order = new_order

        # Save turn to DB
        db_turn = models.DebateTurn(
            debate_id=debate_id,
            participant_id=participant_id,
            content=response_text,
            turn_type="AI"
        )
        self.db.add(db_turn)

        # Status logic: if all participant turns in the planned order are done
        participant_ai_turns_after = participant_ai_turns + (1 if participant_id is not None else 0)
        
        if participant_ai_turns_after >= len(debate.participant_order or []):
            debate.status = "COMPLETE"
        else:
            debate.status = "WIP"

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
