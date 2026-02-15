"""Initial schema with all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_role enum type
    user_role = postgresql.ENUM('admin', 'operator', 'viewer', name='userrole', create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)
    
    # Create inventory_status enum type
    inventory_status = postgresql.ENUM('Tersedia', 'Diperbarui', 'Berpindah', 'Hilang', name='inventorystatus', create_type=False)
    inventory_status.create(op.get_bind(), checkfirst=True)
    
    # Create device_type enum type
    device_type = postgresql.ENUM('barcode_scanner', 'rfid_reader', 'mobile_scanner', 'tablet', 'computer', name='devicetype', create_type=False)
    device_type.create(op.get_bind(), checkfirst=True)
    
    # Create alert_severity enum type
    alert_severity = postgresql.ENUM('info', 'warning', 'error', 'critical', name='alertseverity', create_type=False)
    alert_severity.create(op.get_bind(), checkfirst=True)

    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('role', postgresql.ENUM('admin', 'operator', 'viewer', name='userrole', create_type=False), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Locations table
    op.create_table(
        'locations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('zone', sa.String(), nullable=True),
        sa.Column('aisle', sa.String(), nullable=True),
        sa.Column('rack', sa.String(), nullable=True),
        sa.Column('shelf', sa.String(), nullable=True),
        sa.Column('bin', sa.String(), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('current_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_locations_name', 'locations', ['name'], unique=True)

    # Inventory table
    op.create_table(
        'inventory',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('sku', sa.String(), nullable=True),
        sa.Column('barcode', sa.String(), nullable=True),
        sa.Column('qr_code', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('locations.id'), nullable=True),
        sa.Column('status', postgresql.ENUM('Tersedia', 'Diperbarui', 'Berpindah', 'Hilang', name='inventorystatus', create_type=False), nullable=False, server_default='Tersedia'),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('min_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_quantity', sa.Integer(), nullable=True),
        sa.Column('unit', sa.String(), nullable=False, server_default='pcs'),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('last_scanned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_scanned_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_inventory_name', 'inventory', ['name'])
    op.create_index('ix_inventory_barcode', 'inventory', ['barcode'], unique=True)
    op.create_index('ix_inventory_sku', 'inventory', ['sku'], unique=True)
    op.create_index('ix_inventory_qr_code', 'inventory', ['qr_code'], unique=True)

    # Devices table
    op.create_table(
        'devices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('device_type', postgresql.ENUM('barcode_scanner', 'rfid_reader', 'mobile_scanner', 'tablet', 'computer', name='devicetype', create_type=False), nullable=False),
        sa.Column('serial_number', sa.String(), nullable=True),
        sa.Column('api_key', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('battery_level', sa.Integer(), nullable=True),
        sa.Column('firmware_version', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_devices_name', 'devices', ['name'])
    op.create_index('ix_devices_api_key', 'devices', ['api_key'], unique=True)

    # Device alerts table
    op.create_table(
        'device_alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('devices.id'), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('severity', postgresql.ENUM('info', 'warning', 'error', 'critical', name='alertseverity', create_type=False), nullable=False, server_default='info'),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Activity logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('inventory_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inventory.id'), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('action_type', sa.String(), nullable=True),
        sa.Column('user', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('has_barcode_scan', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_alert', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Scan history table
    op.create_table(
        'scan_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('inventory_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('inventory.id'), nullable=True),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('devices.id'), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('scan_type', sa.String(), nullable=False, server_default='barcode'),
        sa.Column('scanned_data', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('is_successful', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Tasks table (existing)
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tasks_id', 'tasks', ['id'])
    op.create_index('ix_tasks_title', 'tasks', ['title'])


def downgrade() -> None:
    op.drop_table('tasks')
    op.drop_table('scan_history')
    op.drop_table('activity_logs')
    op.drop_table('device_alerts')
    op.drop_table('devices')
    op.drop_table('inventory')
    op.drop_table('locations')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS inventorystatus')
    op.execute('DROP TYPE IF EXISTS devicetype')
    op.execute('DROP TYPE IF EXISTS alertseverity')
