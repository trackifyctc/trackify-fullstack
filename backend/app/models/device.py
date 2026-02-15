import uuid
import secrets
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    WARNING = "warning"


class DeviceType(str, enum.Enum):
    SCANNER = "scanner"
    SENSOR = "sensor"
    CAMERA = "camera"
    GATEWAY = "gateway"


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    device_type = Column(Enum(DeviceType), default=DeviceType.SCANNER, nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    api_key = Column(String(64), unique=True, nullable=False, default=lambda: secrets.token_hex(32))
    
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(100), nullable=True)  # Human readable location name
    
    status = Column(Enum(DeviceStatus), default=DeviceStatus.OFFLINE, nullable=False)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    firmware_version = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    mac_address = Column(String(17), nullable=True)
    
    is_active = Column(Boolean, default=True)
    configuration = Column(Text, nullable=True)  # JSON string for device config
    
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
    location_ref = relationship("Location", back_populates="devices")
    alerts = relationship("DeviceAlert", back_populates="device", cascade="all, delete-orphan")
    scan_history = relationship("ScanHistory", back_populates="device", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Device {self.name}>"


class AlertType(str, enum.Enum):
    MOTION = "motion"
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    UNAUTHORIZED = "unauthorized"
    LOW_STOCK = "low_stock"
    DEVICE_OFFLINE = "device_offline"
    CUSTOM = "custom"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DeviceAlert(Base):
    __tablename__ = "device_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    data = Column(Text, nullable=True)  # JSON string for additional data
    
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    device = relationship("Device", back_populates="alerts")

    def __repr__(self) -> str:
        return f"<DeviceAlert {self.title}>"
