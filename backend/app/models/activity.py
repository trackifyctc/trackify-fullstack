import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ActionType(str, enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    SCANNED = "scanned"
    MOVED = "moved"
    BORROWED = "borrowed"
    RETURNED = "returned"
    ALERT = "alert"
    LOGIN = "login"
    LOGOUT = "logout"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action = Column(String(100), nullable=False)
    action_type = Column(Enum(ActionType), nullable=True)
    user = Column(String(100), nullable=True)  # Human readable user name
    location = Column(String(100), nullable=True)
    
    has_barcode_scan = Column(Boolean, default=False)
    is_alert = Column(Boolean, default=False)
    details = Column(Text, nullable=True)  # JSON string for additional details
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    inventory_item = relationship("Inventory", back_populates="activity_logs")

    def __repr__(self) -> str:
        return f"<ActivityLog {self.action}>"


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id", ondelete="SET NULL"), nullable=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    scan_type = Column(String(50), default="qr_code")  # qr_code, barcode, rfid
    scanned_data = Column(String(500), nullable=False)
    location = Column(String(100), nullable=True)
    
    is_successful = Column(Boolean, default=True)
    error_message = Column(String(500), nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    inventory_item = relationship("Inventory", back_populates="scan_history")
    device = relationship("Device", back_populates="scan_history")

    def __repr__(self) -> str:
        return f"<ScanHistory {self.scanned_data}>"
