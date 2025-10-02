"""
API endpoints for managing constant/reference value cards.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.models.database import ConstantCard, SessionLocal

router = APIRouter()


# Pydantic models
class ConstantCardCreate(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = '#3b82f6'


class ConstantCardUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class ConstantCardResponse(BaseModel):
    id: str
    name: str
    value: float
    unit: Optional[str]
    description: Optional[str]
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/constants", response_model=List[ConstantCardResponse])
def get_constants(db: Session = Depends(get_db)):
    """Get all constant cards."""
    constants = db.query(ConstantCard).all()
    return constants


@router.post("/constants", response_model=ConstantCardResponse)
def create_constant(constant: ConstantCardCreate, db: Session = Depends(get_db)):
    """Create a new constant card."""
    new_constant = ConstantCard(
        id=str(uuid.uuid4()),
        name=constant.name,
        value=constant.value,
        unit=constant.unit,
        description=constant.description,
        color=constant.color or '#3b82f6'
    )
    db.add(new_constant)
    db.commit()
    db.refresh(new_constant)
    return new_constant


@router.put("/constants/{constant_id}", response_model=ConstantCardResponse)
def update_constant(
    constant_id: str,
    constant: ConstantCardUpdate,
    db: Session = Depends(get_db)
):
    """Update a constant card."""
    db_constant = db.query(ConstantCard).filter(ConstantCard.id == constant_id).first()
    if not db_constant:
        raise HTTPException(status_code=404, detail="Constant card not found")

    if constant.name is not None:
        db_constant.name = constant.name
    if constant.value is not None:
        db_constant.value = constant.value
    if constant.unit is not None:
        db_constant.unit = constant.unit
    if constant.description is not None:
        db_constant.description = constant.description
    if constant.color is not None:
        db_constant.color = constant.color

    db_constant.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_constant)
    return db_constant


@router.delete("/constants/{constant_id}")
def delete_constant(constant_id: str, db: Session = Depends(get_db)):
    """Delete a constant card."""
    db_constant = db.query(ConstantCard).filter(ConstantCard.id == constant_id).first()
    if not db_constant:
        raise HTTPException(status_code=404, detail="Constant card not found")

    db.delete(db_constant)
    db.commit()
    return {"message": "Constant card deleted successfully"}
