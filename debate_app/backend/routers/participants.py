from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter()

class ParticipantCreate(BaseModel):
    name: str
    role: str
    system_instruction: str

class ParticipantResponse(ParticipantCreate):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ParticipantResponse])
def get_participants(db: Session = Depends(get_db)):
    return db.query(models.Participant).all()

@router.post("/", response_model=ParticipantResponse)
def create_participant(participant: ParticipantCreate, db: Session = Depends(get_db)):
    db_participant = models.Participant(**participant.dict())
    db.add(db_participant)
    try:
        db.commit()
        db.refresh(db_participant)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Participant with this name already exists")
    return db_participant

@router.delete("/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    db_participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not db_participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    db.delete(db_participant)
    db.commit()
    return {"message": "Deleted"}
