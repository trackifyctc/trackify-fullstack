-- Trackify Complete Database Schema
-- Version 2.0.0
-- This migration creates all tables for the Trackify warehouse inventory system

-- ============================================
-- EXTENSION SETUP
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CUSTOM TYPES / ENUMS
-- ============================================

-- Inventory item status
DO $$ BEGIN
    CREATE TYPE inventory_status AS ENUM ('Available', 'Borrowed', 'Missing', 'Damaged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Device status
DO $$ BEGIN
    CREATE TYPE device_status AS ENUM ('online', 'offline', 'warning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alert types
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM ('motion', 'temperature', 'humidity', 'unauthorized', 'low_stock', 'device_offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alert severity
DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Scan types
DO $$ BEGIN
    CREATE TYPE scan_type AS ENUM ('qr', 'barcode', 'rfid', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer',
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================
-- TABLE: locations
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    floor VARCHAR(20),
    zone VARCHAR(50),
    building VARCHAR(100),
    capacity INT,
    current_items INT DEFAULT 0,
    coordinates JSONB,
    -- coordinates format: {"lat": 0.0, "lng": 0.0} or {"x": 0, "y": 0, "z": 0}
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    humidity_min DECIMAL(5,2),
    humidity_max DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_zone ON locations(zone);
CREATE INDEX IF NOT EXISTS idx_locations_building ON locations(building);

-- ============================================
-- TABLE: inventory
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    -- QR Code format: TRK-{UUID first 8 chars}-{timestamp}
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category VARCHAR(100), -- Denormalized for quick access
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location VARCHAR(100), -- Denormalized for quick access
    status inventory_status DEFAULT 'Available',
    quantity INT DEFAULT 1 CHECK (quantity >= 0),
    min_quantity INT DEFAULT 0,
    max_quantity INT,
    unit VARCHAR(50) DEFAULT 'pcs',
    price DECIMAL(15,2),
    cost DECIMAL(15,2),
    supplier VARCHAR(255),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    image_url TEXT,
    notes TEXT,
    tags TEXT[], -- Array of tags for flexible categorization
    custom_fields JSONB, -- For extensible attributes
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_moved_at TIMESTAMPTZ,
    last_moved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_qr_code ON inventory(qr_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_tags ON inventory USING GIN(tags);

-- ============================================
-- TABLE: devices
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    -- Types: motion_sensor, temp_sensor, humidity_sensor, scanner, camera, gateway
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    -- API Key: sha256 hash, generated on device registration
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location VARCHAR(100), -- Denormalized
    status device_status DEFAULT 'offline',
    firmware_version VARCHAR(50),
    hardware_version VARCHAR(50),
    ip_address INET,
    mac_address MACADDR,
    last_heartbeat TIMESTAMPTZ,
    config JSONB,
    -- Device-specific configuration
    capabilities TEXT[], -- Array of capabilities
    is_active BOOLEAN DEFAULT true,
    registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(location_id);

-- ============================================
-- TABLE: device_alerts
-- ============================================
CREATE TABLE IF NOT EXISTS device_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity alert_severity DEFAULT 'medium',
    message TEXT NOT NULL,
    data JSONB,
    -- Alert-specific data (temperature readings, motion coordinates, etc.)
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_alerts_device ON device_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alerts_type ON device_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_device_alerts_severity ON device_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_device_alerts_acknowledged ON device_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_device_alerts_resolved ON device_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_device_alerts_created ON device_alerts(created_at DESC);

-- ============================================
-- TABLE: activity_logs
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    -- Actions: Item Created, Item Updated, Item Deleted, Item Scanned, 
    --          Item Moved, Unauthorized Movement Detected, Low Stock Alert,
    --          Device Registered, Device Alert, etc.
    user_name VARCHAR(255), -- Denormalized for log readability
    location VARCHAR(100),
    previous_location VARCHAR(100),
    previous_status inventory_status,
    new_status inventory_status,
    quantity_change INT,
    has_barcode_scan BOOLEAN DEFAULT false,
    scan_type scan_type,
    is_alert BOOLEAN DEFAULT false,
    details JSONB,
    -- Additional context data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_item ON activity_logs(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_device ON activity_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_alert ON activity_logs(is_alert);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- TABLE: scan_history
-- ============================================
CREATE TABLE IF NOT EXISTS scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scan_type scan_type NOT NULL,
    code_scanned VARCHAR(255) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location VARCHAR(100),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_item ON scan_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_device ON scan_history(device_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_code ON scan_history(code_scanned);
CREATE INDEX IF NOT EXISTS idx_scan_history_created ON scan_history(created_at DESC);

-- ============================================
-- TABLE: admin_logs
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    -- Actions: Login, Logout, User Created, User Updated, User Deleted,
    --          Settings Changed, Export Data, etc.
    resource_type VARCHAR(50),
    resource_id UUID,
    previous_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- ============================================
-- TABLE: inventory_movements
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
    from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    quantity INT DEFAULT 1,
    reason VARCHAR(255),
    notes TEXT,
    moved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    authorized_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_authorized BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_movements_from ON inventory_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_movements_to ON inventory_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);

-- ============================================
-- TABLE: inventory_counts
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    -- Status: pending, in_progress, completed, cancelled
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expected_items INT,
    counted_items INT DEFAULT 0,
    discrepancies INT DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: inventory_count_items
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE NOT NULL,
    inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    expected_quantity INT,
    actual_quantity INT,
    discrepancy INT,
    notes TEXT,
    counted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: settings
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
        NEW.qr_code := 'TRK-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8)) || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update location item count
CREATE OR REPLACE FUNCTION update_location_item_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE locations SET current_items = current_items + 1 
        WHERE id = NEW.location_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE locations SET current_items = current_items - 1 
        WHERE id = OLD.location_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.location_id IS DISTINCT FROM OLD.location_id THEN
        UPDATE locations SET current_items = current_items - 1 
        WHERE id = OLD.location_id;
        UPDATE locations SET current_items = current_items + 1 
        WHERE id = NEW.location_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate QR code for inventory
DROP TRIGGER IF EXISTS generate_inventory_qr_code ON inventory;
CREATE TRIGGER generate_inventory_qr_code
    BEFORE INSERT ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION generate_qr_code();

-- Update location item count
DROP TRIGGER IF EXISTS update_location_count ON inventory;
CREATE TRIGGER update_location_count
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_location_item_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY admin_all ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON inventory FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON locations FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON devices FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON device_alerts FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON activity_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON scan_history FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON admin_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON inventory_movements FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all ON settings FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Operators can read and update inventory
CREATE POLICY operator_inventory_select ON inventory FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

CREATE POLICY operator_inventory_update ON inventory FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operator'))
);

-- Viewers can only read
CREATE POLICY viewer_inventory_select ON inventory FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
);

CREATE POLICY viewer_locations_select ON locations FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
);

CREATE POLICY viewer_categories_select ON categories FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
);

-- Public settings are readable by anyone
CREATE POLICY public_settings_select ON settings FOR SELECT USING (is_public = true);

-- ============================================
-- SEED DATA
-- ============================================

-- Default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@trackify.com', crypt('admin123', gen_salt('bf')), 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Default categories
INSERT INTO categories (name, description, color, icon) VALUES
('Electronics', 'Electronic devices and components', '#3B82F6', 'cpu'),
('Office Supplies', 'Office and stationery items', '#22C55E', 'paperclip'),
('Furniture', 'Office and warehouse furniture', '#EAB308', 'armchair'),
('Tools', 'Hand tools and power tools', '#EF4444', 'wrench'),
('Safety Equipment', 'PPE and safety gear', '#F97316', 'shield'),
('Raw Materials', 'Manufacturing raw materials', '#8B5CF6', 'package')
ON CONFLICT DO NOTHING;

-- Default locations
INSERT INTO locations (name, code, floor, zone, capacity) VALUES
('Warehouse A', 'WH-A', '1', 'Storage', 500),
('Warehouse B', 'WH-B', '1', 'Storage', 300),
('Loading Dock', 'LD-1', 'G', 'Logistics', 100),
('Cold Storage', 'CS-1', 'B1', 'Special', 200),
('Assembly Area', 'AA-1', '2', 'Production', 150)
ON CONFLICT (code) DO NOTHING;

-- Default settings
INSERT INTO settings (key, value, description, category, is_public) VALUES
('low_stock_threshold', '10'::jsonb, 'Default minimum quantity before low stock alert', 'inventory', false),
('qr_code_prefix', '"TRK"'::jsonb, 'Prefix for generated QR codes', 'inventory', true),
('device_heartbeat_interval', '60'::jsonb, 'Expected device heartbeat interval in seconds', 'devices', false),
('max_login_attempts', '5'::jsonb, 'Maximum failed login attempts before lockout', 'security', false),
('lockout_duration', '300'::jsonb, 'Account lockout duration in seconds', 'security', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
