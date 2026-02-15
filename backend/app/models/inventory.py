import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class InventoryStatus(str, enum.Enum):
    TERSEDIA = "Tersedia"
    DIPERBARUI = "Diperbarui"
    BERPINDAH = "Berpindah"
    HILANG = "Hilang"


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=False)
    barcode = Column(String(100), unique=True, nullable=True, index=True)
    qr_code = Column(Text, nullable=True)  # Base64 encoded QR code image
    category = Column(String(100), default="Uncategorized")
    
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(100), nullable=False)  # Human readable location name
    
    status = Column(
        ENUM('Tersedia', 'Diperbarui', 'Berpindah', 'Hilang', name='inventorystatus', create_type=False),
        default='Tersedia',
        nullable=False
    )
    quantity = Column(Integer, default=1)
    min_quantity = Column(Integer, default=0)
    max_quantity = Column(Integer, nullable=True)
    unit = Column(String(50), default="pcs")
    price = Column(Numeric(12, 2), nullable=True)
    
    image_url = Column(String(500), nullable=True)
    last_scanned_at = Column(DateTime(timezone=True), nullable=True)
    last_scanned_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    location_ref = relationship("Location", back_populates="items")
    activity_logs = relationship("ActivityLog", back_populates="inventory_item", cascade="all, delete-orphan")
    scan_history = relationship("ScanHistory", back_populates="inventory_item", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Inventory {self.name}>"
