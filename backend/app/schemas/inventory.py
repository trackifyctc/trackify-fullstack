from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class InventoryStatus(str, Enum):
    TERSEDIA = "Tersedia"
    DIPERBARUI = "Diperbarui"
    BERPINDAH = "Berpindah"
    HILANG = "Hilang"


class InventoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: str = "Uncategorized"
    location: str
    location_id: Optional[UUID] = None
    status: InventoryStatus = InventoryStatus.TERSEDIA
    quantity: int = 1
    min_quantity: int = 0
    max_quantity: Optional[int] = None
    unit: str = "pcs"
    price: Optional[float] = None
    image_url: Optional[str] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    location_id: Optional[UUID] = None
    status: Optional[InventoryStatus] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None


class InventoryRead(InventoryBase):
    id: UUID
    qr_code: Optional[str] = None
    last_scanned_at: Optional[datetime] = None
    last_scanned_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryStats(BaseModel):
    total_items: int
    available_items: int
    borrowed_items: int
    missing_items: int
    damaged_items: int
    low_stock_items: int
    total_value: float
