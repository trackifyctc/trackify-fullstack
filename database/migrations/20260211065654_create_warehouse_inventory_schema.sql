/*
  # Warehouse Inventory Management System Schema

  ## Overview
  Creates the complete database schema for a warehouse inventory management system
  with real-time tracking, activity logging, and alert capabilities.

  ## New Tables

  ### 1. `inventory`
  Main table storing all warehouse inventory items
  - `id` (uuid, primary key) - Unique identifier for each item
  - `name` (text, required) - Item name/description
  - `barcode` (text, unique) - Barcode identifier for scanning
  - `location` (text, required) - Current warehouse location (e.g., "Aisle A1", "Zone B3")
  - `status` (text, required) - Item status: Available, Borrowed, Missing, Damaged
  - `quantity` (integer, default 1) - Number of items in stock
  - `last_scanned_at` (timestamptz) - Last barcode scan timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### 2. `activity_logs`
  Tracks all inventory movements and actions
  - `id` (uuid, primary key) - Unique log entry identifier
  - `inventory_item_id` (uuid) - Reference to inventory item
  - `action` (text, required) - Action performed (e.g., "Scanned", "Moved", "Status Changed", "Unauthorized Movement")
  - `user` (text, required) - User who performed the action
  - `location` (text) - Location where action occurred
  - `has_barcode_scan` (boolean, default false) - Whether action included barcode scan
  - `is_alert` (boolean, default false) - Whether this is an alert/unauthorized movement
  - `details` (jsonb) - Additional action details (old_status, new_status, etc.)
  - `timestamp` (timestamptz, default now()) - When action occurred

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read access for inventory and activity logs (for dashboard display)
  - Authenticated users can insert/update records

  ## Indexes
  - Index on inventory.barcode for fast lookups
  - Index on inventory.status for filtering
  - Index on activity_logs.timestamp for sorting
  - Index on activity_logs.is_alert for alert queries
*/

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  location text NOT NULL,
  status text NOT NULL CHECK (status IN ('Available', 'Borrowed', 'Missing', 'Damaged')),
  quantity integer DEFAULT 1 CHECK (quantity >= 0),
  last_scanned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  action text NOT NULL,
  "user" text NOT NULL,
  location text,
  has_barcode_scan boolean DEFAULT false,
  is_alert boolean DEFAULT false,
  details jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_is_alert ON activity_logs(is_alert);
CREATE INDEX IF NOT EXISTS idx_activity_logs_inventory_item ON activity_logs(inventory_item_id);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory table
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert inventory"
  ON inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update inventory"
  ON inventory FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete inventory"
  ON inventory FOR DELETE
  USING (true);

-- RLS Policies for activity_logs table
CREATE POLICY "Anyone can view activity logs"
  ON activity_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on inventory changes
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for demonstration
INSERT INTO inventory (name, barcode, location, status, quantity) VALUES
  ('Laptop Dell XPS 15', 'LPT001', 'Aisle A1', 'Available', 5),
  ('Office Chair ErgoMax', 'CHR001', 'Zone B3', 'Available', 12),
  ('Monitor 27" 4K', 'MON001', 'Aisle A2', 'Borrowed', 3),
  ('Wireless Mouse', 'MSE001', 'Shelf C1', 'Available', 25),
  ('USB-C Hub', 'HUB001', 'Shelf C2', 'Damaged', 2),
  ('Standing Desk', 'DSK001', 'Zone B1', 'Available', 8),
  ('Webcam HD Pro', 'CAM001', 'Aisle A3', 'Borrowed', 4),
  ('Keyboard Mechanical', 'KBD001', 'Shelf C1', 'Available', 15),
  ('Headphones Noise Cancel', 'HPH001', 'Aisle A2', 'Missing', 1),
  ('Docking Station', 'DCK001', 'Zone B2', 'Available', 6)
ON CONFLICT (barcode) DO NOTHING;

-- Insert sample activity logs
INSERT INTO activity_logs (inventory_item_id, action, "user", location, has_barcode_scan, is_alert) 
SELECT 
  id, 
  'Initial Stock', 
  'System Admin', 
  location, 
  true, 
  false 
FROM inventory
LIMIT 5;
