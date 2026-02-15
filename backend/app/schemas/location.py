from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    floor: Optional[str] = None
    zone: Optional[str] = None
    capacity: Optional[int] = None
    coordinates: Optional[Dict[str, Any]] = None
    is_active: bool = True


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    floor: Optional[str] = None
    zone: Optional[str] = None
    capacity: Optional[int] = None
    coordinates: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class LocationRead(LocationBase):
    id: UUID
    current_items: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LocationWithItems(LocationRead):
    items_count: int = 0
