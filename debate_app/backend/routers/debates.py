from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from database import get_db
import models
from services.discussion import DiscussionService

router = APIRouter()

class DebateCreate(BaseModel):
    topic: str
    rounds: int = 3
    participant_ids: List[int]
    participant_order: List[Optional[int]] = []
    config: Optional[Dict[str, Any]] = {}

class TurnResponse(BaseModel):
    id: int
    content: str
    turn_type: str
    participant_name: Optional[str]
    participant_id: Optional[int]
    timestamp: Any

    class Config:
        from_attributes = True

class DebateResponse(BaseModel):
    id: int
    topic: str
    status: str
    rounds: int
    participant_order: List[Optional[int]]
    turns: List[TurnResponse]
    class Config:
        from_attributes = True

class DebateSummary(BaseModel):
    id: int
    topic: str
    status: str
    created_at: Any
    class Config:
        from_attributes = True

@router.post("/", response_model=DebateResponse)
def create_debate(data: DebateCreate, db: Session = Depends(get_db)):
    # Verify participants exist
    participants = db.query(models.Participant).filter(models.Participant.id.in_(data.participant_ids)).all()
    if len(participants) != len(data.participant_ids):
        raise HTTPException(status_code=400, detail="One or more participants not found")

    db_debate = models.Debate(
        topic=data.topic,
        rounds=data.rounds,
        config=data.config,
        participant_order=data.participant_order or data.participant_ids,
        status="WIP"
    )
    db.add(db_debate)
    db.commit()
    db.refresh(db_debate)
    return db_debate

@router.get("/", response_model=List[DebateSummary])
def list_debates(db: Session = Depends(get_db)):
    debates = db.query(models.Debate).order_by(models.Debate.created_at.desc()).all()
    return debates

@router.get("/{debate_id}", response_model=DebateResponse)
def get_debate(debate_id: int, db: Session = Depends(get_db)):
    debate = db.query(models.Debate).filter(models.Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    
    # Map turns for response
    turns = []
    for turn in debate.turns:
        turns.append({
            "id": turn.id,
            "content": turn.content,
            "turn_type": turn.turn_type,
            "participant_name": turn.participant.name if turn.participant else ( "User" if turn.turn_type == "USER" else "System"),
            "participant_id": turn.participant_id,
            "timestamp": turn.timestamp
        })
    
    return {
        "id": debate.id,
        "topic": debate.topic,
        "status": debate.status,
        "rounds": debate.rounds,
        "participant_order": debate.participant_order,
        "turns": turns
    }

@router.post("/{debate_id}/reorder")
def reorder_debate(debate_id: int, participant_order: List[Optional[int]], db: Session = Depends(get_db)):
    debate = db.query(models.Debate).filter(models.Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    debate.participant_order = participant_order
    
    # Update status based on turn count
    participant_ai_turns = db.query(models.DebateTurn).filter(
        models.DebateTurn.debate_id == debate_id,
        models.DebateTurn.turn_type == "AI",
        models.DebateTurn.participant_id != None
    ).count()
    
    if participant_ai_turns >= len(participant_order):
        debate.status = "COMPLETE"
    else:
        debate.status = "WIP"
        
    db.commit()
    return {"status": "ok"}

@router.post("/{debate_id}/next")
def generate_next_turn(debate_id: int, participant_id: Optional[int] = None, db: Session = Depends(get_db)):
    service = DiscussionService(db)
    try:
        turn = service.generate_ai_turn(debate_id, participant_id)
        return turn
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{debate_id}/inject")
def inject_message(debate_id: int, content: str, db: Session = Depends(get_db)):
    service = DiscussionService(db)
    turn = service.inject_user_message(debate_id, content)
    return turn

@router.delete("/{debate_id}")
def delete_debate(debate_id: int, db: Session = Depends(get_db)):
    debate = db.query(models.Debate).filter(models.Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    
    # Delete associated turns manually since cascade is not explicitly in models
    db.query(models.DebateTurn).filter(models.DebateTurn.debate_id == debate_id).delete()
    
    db.delete(debate)
    db.commit()
    return {"status": "ok"}
