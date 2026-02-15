import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class CameraCapture(Base):
    """Model untuk menyimpan tangkapan kamera dari perangkat (Raspberry Pi)"""
    __tablename__ = "camera_captures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    
    # Image data
    image_url = Column(String(500), nullable=True)  # URL gambar (bisa dari storage)
    image_base64 = Column(Text, nullable=True)  # Atau base64 encoded image
    thumbnail_url = Column(String(500), nullable=True)
    
    # Metadata
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    location_name = Column(String(100), nullable=True)  # Human readable location
    
    # Detection data (JSON string)
    detected_objects = Column(Text, nullable=True)  # JSON: [{type: "person", confidence: 0.95}]
    detected_count = Column(Integer, default=0)
    
    # Status
    is_alert = Column(Boolean, default=False)
    alert_type = Column(String(50), nullable=True)  # motion, intrusion, anomaly
    is_reviewed = Column(Boolean, default=False)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    captured_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    device = relationship("Device", backref="camera_captures")
    location = relationship("Location", backref="camera_captures")

    def __repr__(self) -> str:
        return f"<CameraCapture {self.id} from device {self.device_id}>"
