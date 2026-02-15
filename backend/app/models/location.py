import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    floor = Column(String(50), nullable=True)
    zone = Column(String(50), nullable=True)
    capacity = Column(Integer, nullable=True)
    current_items = Column(Integer, default=0)
    coordinates = Column(JSON, nullable=True)  # {"x": 0, "y": 0, "z": 0}
    is_active = Column(Boolean, default=True)
    
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
    items = relationship("Inventory", back_populates="location_ref")
    devices = relationship("Device", back_populates="location_ref")

    def __repr__(self) -> str:
        return f"<Location {self.name}>"
