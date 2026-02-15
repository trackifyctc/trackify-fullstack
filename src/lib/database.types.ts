export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type InventoryStatus = 'Available' | 'Borrowed' | 'Missing' | 'Damaged';
export type AlertType = 'motion' | 'temperature' | 'humidity' | 'unauthorized' | 'low_stock' | 'device_offline';
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Database {
  public: {
    Tables: {
      // Users table for authentication
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: UserRole;
          avatar_url: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role?: UserRole;
          avatar_url?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Inventory items
      inventory: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sku: string;
          barcode: string | null;
          qr_code: string;
          category: string;
          location_id: string | null;
          location: string;
          status: InventoryStatus;
          quantity: number;
          min_quantity: number;
          max_quantity: number | null;
          unit: string;
          price: number | null;
          image_url: string | null;
          last_scanned_at: string | null;
          last_scanned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku?: string;
          barcode?: string | null;
          qr_code?: string;
          category?: string;
          location_id?: string | null;
          location: string;
          status?: InventoryStatus;
          quantity?: number;
          min_quantity?: number;
          max_quantity?: number | null;
          unit?: string;
          price?: number | null;
          image_url?: string | null;
          last_scanned_at?: string | null;
          last_scanned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string;
          barcode?: string | null;
          qr_code?: string;
          category?: string;
          location_id?: string | null;
          location?: string;
          status?: InventoryStatus;
          quantity?: number;
          min_quantity?: number;
          max_quantity?: number | null;
          unit?: string;
          price?: number | null;
          image_url?: string | null;
          last_scanned_at?: string | null;
          last_scanned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Locations/Zones
      locations: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          floor: string | null;
          zone: string | null;
          capacity: number | null;
          current_items: number;
          coordinates: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          floor?: string | null;
          zone?: string | null;
          capacity?: number | null;
          current_items?: number;
          coordinates?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          floor?: string | null;
          zone?: string | null;
          capacity?: number | null;
          current_items?: number;
          coordinates?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Activity logs
      activity_logs: {
        Row: {
          id: string;
          inventory_item_id: string | null;
          device_id: string | null;
          user_id: string | null;
          action: string;
          user: string;
          location: string | null;
          has_barcode_scan: boolean;
          is_alert: boolean;
          alert_type: AlertType | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          inventory_item_id?: string | null;
          device_id?: string | null;
          user_id?: string | null;
          action: string;
          user: string;
          location?: string | null;
          has_barcode_scan?: boolean;
          is_alert?: boolean;
          alert_type?: AlertType | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string | null;
          device_id?: string | null;
          user_id?: string | null;
          action?: string;
          user?: string;
          location?: string | null;
          has_barcode_scan?: boolean;
          is_alert?: boolean;
          alert_type?: AlertType | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
      };
      // Devices (IoT/Hardware)
      devices: {
        Row: {
          id: string;
          name: string;
          device_type: string;
          serial_number: string;
          api_key: string;
          location_id: string | null;
          status: DeviceStatus;
          last_heartbeat: string | null;
          firmware_version: string | null;
          ip_address: string | null;
          mac_address: string | null;
          configuration: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          device_type: string;
          serial_number: string;
          api_key?: string;
          location_id?: string | null;
          status?: DeviceStatus;
          last_heartbeat?: string | null;
          firmware_version?: string | null;
          ip_address?: string | null;
          mac_address?: string | null;
          configuration?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          device_type?: string;
          serial_number?: string;
          api_key?: string;
          location_id?: string | null;
          status?: DeviceStatus;
          last_heartbeat?: string | null;
          firmware_version?: string | null;
          ip_address?: string | null;
          mac_address?: string | null;
          configuration?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Device alerts
      device_alerts: {
        Row: {
          id: string;
          device_id: string;
          alert_type: AlertType;
          severity: 'low' | 'medium' | 'high' | 'critical';
          message: string;
          data: Json | null;
          is_acknowledged: boolean;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          alert_type: AlertType;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          message: string;
          data?: Json | null;
          is_acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          alert_type?: AlertType;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          message?: string;
          data?: Json | null;
          is_acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
        };
      };
      // Scan history
      scan_history: {
        Row: {
          id: string;
          inventory_item_id: string;
          scanned_by: string | null;
          scan_type: 'qr' | 'barcode' | 'manual';
          device_info: Json | null;
          location_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          scanned_by?: string | null;
          scan_type?: 'qr' | 'barcode' | 'manual';
          device_info?: Json | null;
          location_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          scanned_by?: string | null;
          scan_type?: 'qr' | 'barcode' | 'manual';
          device_info?: Json | null;
          location_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      // Categories
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      // Admin logs
      admin_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
