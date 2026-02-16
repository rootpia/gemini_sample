from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class TurnType(enum.Enum):
    AI = "AI"
    USER = "USER"
    SYSTEM = "SYSTEM"

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    role = Column(Text)
    system_instruction = Column(Text)

class Debate(Base):
    __tablename__ = "debates"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    rounds = Column(Integer, default=3)
    status = Column(String, default="active") # active, completed
    config = Column(JSON, default={}) # model_name, temperature etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    turns = relationship("DebateTurn", back_populates="debate")

class DebateTurn(Base):
    __tablename__ = "debate_turns"

    id = Column(Integer, primary_key=True, index=True)
    debate_id = Column(Integer, ForeignKey("debates.id"))
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=True)
    content = Column(Text)
    turn_type = Column(String) # AI, USER, SYSTEM
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    debate = relationship("Debate", back_populates="turns")
    participant = relationship("Participant")
