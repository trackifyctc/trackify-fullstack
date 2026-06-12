// API Configuration
const API_BASE_URL = 'https://trackify-backend-production-1b28.up.railway.app';

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      } catch (parseErr) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`API Error: ${endpoint}`, error.message);
      throw error;
    }
    throw new Error('Network or parsing error');
  }
}

type ListResponse<T> = T[] | { items: T[]; total?: number };

function unwrapListResponse<T>(response: ListResponse<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  return Array.isArray(response?.items) ? response.items : [];
}

// ============================================================================
// Auth API
// ============================================================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  name: string | null; // alias for full_name
  role: 'admin' | 'operator' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'operator' | 'viewer';
}

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterRequest) =>
    fetchApi<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<User>('/api/auth/me'),

  changePassword: (newPassword: string, confirmPassword: string) =>
    fetchApi<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
    }),
};

// ============================================================================
// Inventory API
// ============================================================================
export type InventoryStatus = 'TERSEDIA' | 'DIPERBARUI' | 'BERPINDAH' | 'HILANG';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  qr_code: string | null;
  category: string;
  location: string | Location | any;
  location_id: string | null;
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
}

export interface InventoryCreate {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  location_id?: string;
  quantity?: number;
  min_quantity?: number;
  max_quantity?: number;
  unit?: string;
  price?: number;
  image_url?: string;
}

export interface InventoryUpdate {
  name?: string;
  description?: string | null;
  sku?: string;
  barcode?: string | null;
  qr_code?: string | null;
  category?: string;
  location_id?: string | null;
  status?: InventoryStatus;
  quantity?: number;
  min_quantity?: number;
  max_quantity?: number | null;
  unit?: string;
  price?: number | null;
  image_url?: string | null;
}

export interface InventoryStats {
  total_items: number;
  available_items: number;
  borrowed_items: number;
  missing_items: number;
  damaged_items: number;
  low_stock_items: number;
  total_value: number;
}

export const inventoryApi = {
  list: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    location?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('query', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.location) searchParams.set('location', params.location);
    const query = searchParams.toString();
    return fetchApi<ListResponse<InventoryItem>>(`/api/inventory${query ? `?${query}` : ''}`)
      .then(unwrapListResponse);
  },

  get: (id: string) => fetchApi<InventoryItem>(`/api/inventory/${id}`),

  getByBarcode: (barcode: string) =>
    fetchApi<InventoryItem>(`/api/inventory/barcode/${barcode}`),

  create: (data: InventoryCreate) =>
    fetchApi<InventoryItem>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: InventoryUpdate) =>
    fetchApi<InventoryItem>(`/api/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/inventory/${id}`, { method: 'DELETE' }),

  scan: (id: string) =>
    fetchApi<InventoryItem>(`/api/inventory/${id}/scan`, { method: 'POST' }),

  stats: () => fetchApi<InventoryStats>('/api/inventory/stats'),

  categories: () => fetchApi<string[]>('/api/inventory/categories'),
};

// ============================================================================
// Locations API
// ============================================================================
export interface Location {
  id: string;
  name: string;
  code: string;
  description: string | null;
  floor: string | null;
  zone: string | null;
  capacity: number | null;
  current_items: number;
  coordinates: Record<string, number> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationCreate {
  name: string;
  code: string;
  description?: string;
  floor?: string;
  zone?: string;
  capacity?: number;
  coordinates?: Record<string, number>;
  is_active?: boolean;
}

export interface LocationUpdate {
  name?: string;
  code?: string;
  description?: string;
  floor?: string;
  zone?: string;
  capacity?: number;
  coordinates?: Record<string, number>;
  is_active?: boolean;
}

export const locationsApi = {
  list: (params?: { is_active?: boolean; floor?: string; zone?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined)
      searchParams.set('is_active', params.is_active.toString());
    if (params?.floor) searchParams.set('floor', params.floor);
    if (params?.zone) searchParams.set('zone', params.zone);
    const query = searchParams.toString();
    return fetchApi<ListResponse<Location>>(`/api/locations${query ? `?${query}` : ''}`)
      .then(unwrapListResponse);
  },

  get: (id: string) => fetchApi<Location>(`/api/locations/${id}`),

  getItems: (id: string) =>
    fetchApi<InventoryItem[]>(`/api/locations/${id}/items`),

  create: (data: LocationCreate) =>
    fetchApi<Location>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: LocationUpdate) =>
    fetchApi<Location>(`/api/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/locations/${id}`, { method: 'DELETE' }),

  stats: () => fetchApi<Record<string, number>>('/api/locations/stats'),
};

// ============================================================================
// Devices API
// ============================================================================
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type DeviceType = 'scanner' | 'sensor' | 'camera' | 'gateway';
export type AlertType = 'motion' | 'temperature' | 'humidity' | 'unauthorized' | 'low_stock' | 'device_offline' | 'custom';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  serial_number: string;
  api_key: string;
  location: Location | string | null;
  location_id: string | null;
  status: DeviceStatus;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ip_address: string | null;
  mac_address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreate {
  name: string;
  device_type: DeviceType;
  serial_number: string;
  location_id?: string;
  firmware_version?: string;
  ip_address?: string;
  mac_address?: string;
}

export interface DeviceUpdate {
  name?: string;
  device_type?: DeviceType;
  location?: string;
  location_id?: string;
  firmware_version?: string;
  ip_address?: string;
  mac_address?: string;
  is_active?: boolean;
}

export interface DeviceAlert {
  id: string;
  device_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  data: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// ============================================================================
// SERVO COMMAND TYPES
// ============================================================================

export enum ServoDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  RESET = 'reset',
}

export interface ServoCommand {
  id: string;
  device_id: string;
  direction: ServoDirection;
  angle: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  created_at: string;
  executed_at?: string;
  error_message?: string;
}

export const devicesApi = {
  list: (params?: { status?: string; device_type?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.device_type) searchParams.set('device_type', params.device_type);
    if (params?.is_active !== undefined)
      searchParams.set('is_active', params.is_active.toString());
    const query = searchParams.toString();
    return fetchApi<ListResponse<Device>>(`/api/devices${query ? `?${query}` : ''}`)
      .then(unwrapListResponse);
  },

  get: (id: string) => fetchApi<Device>(`/api/devices/${id}`),

  create: (data: DeviceCreate) =>
    fetchApi<Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DeviceUpdate) =>
    fetchApi<Device>(`/api/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/devices/${id}`, { method: 'DELETE' }),

  regenerateKey: (id: string) =>
    fetchApi<Device>(`/api/devices/${id}/regenerate-key`, { method: 'POST' }),

  stats: () => fetchApi<Record<string, number>>('/api/devices/stats'),

  // Alerts
  alerts: (params?: {
    device_id?: string;
    alert_type?: string;
    is_acknowledged?: boolean;
    is_resolved?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.device_id) searchParams.set('device_id', params.device_id);
    if (params?.alert_type) searchParams.set('alert_type', params.alert_type);
    if (params?.is_acknowledged !== undefined)
      searchParams.set('is_acknowledged', params.is_acknowledged.toString());
    if (params?.is_resolved !== undefined)
      searchParams.set('is_resolved', params.is_resolved.toString());
    const query = searchParams.toString();
    return fetchApi<DeviceAlert[]>(`/api/devices/alerts/all${query ? `?${query}` : ''}`);
  },

  acknowledgeAlert: (alertId: string) =>
    fetchApi<DeviceAlert>(`/api/devices/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    }),

  resolveAlert: (alertId: string) =>
    fetchApi<DeviceAlert>(`/api/devices/alerts/${alertId}/resolve`, {
      method: 'POST',
    }),

  // 🎥 SERVO COMMANDS
  sendServoCommand: (deviceId: string, direction: string, angle?: number) =>
    fetchApi<ServoCommand>(`/api/devices/${deviceId}/servo/command`, {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        direction,
        angle: angle || 30,
      }),
    }),

  getServoHistory: (deviceId: string) =>
    fetchApi<ServoCommand[]>(`/api/devices/${deviceId}/servo/history`),

  getServoStats: (deviceId: string) =>
    fetchApi<{
      total: number;
      pending: number;
      processing: number;
      success: number;
      failed: number;
    }>(`/api/devices/${deviceId}/servo/stats`),

  markServoExecuted: (commandId: string, responseData: any, status: string = 'success') =>
    fetchApi<ServoCommand>(`/api/devices/servo/${commandId}/mark-executed`, {
      method: 'POST',
      body: JSON.stringify({
        response_data: responseData,
        status,
      }),
    }),
};

// ============================================================================
// Activity API
// ============================================================================
export interface ActivityLog {
  id: string;
  inventory_item_id: string | null;
  user_id: string | null;
  action: string;
  action_type: string | null;
  user:
    | string
    | {
        id: string;
        email: string;
        full_name?: string | null;
        name?: string | null;
      }
    | null;
  location: string | null;
  has_barcode_scan: boolean;
  is_alert: boolean;
  details: string | null;
  created_at: string;
}

export interface ScanHistory {
  id: string;
  inventory_item_id: string | null;
  device_id: string | null;
  user_id: string | null;
  scan_type: string;
  scanned_data: string;
  location: string | null;
  is_successful: boolean;
  error_message: string | null;
  created_at: string;
}

export const activityApi = {
  logs: (params?: {
    skip?: number;
    limit?: number;
    inventory_item_id?: string;
    action_type?: string;
    is_alert?: boolean;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.inventory_item_id) searchParams.set('inventory_item_id', params.inventory_item_id);
    if (params?.action_type) searchParams.set('action_type', params.action_type);
    if (params?.is_alert !== undefined)
      searchParams.set('is_alert', params.is_alert.toString());
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    const query = searchParams.toString();
    return fetchApi<ListResponse<ActivityLog>>(`/api/activity/logs${query ? `?${query}` : ''}`)
      .then(unwrapListResponse);
  },

  recent: (limit = 10) =>
    fetchApi<ActivityLog[]>(`/api/activity/recent?limit=${limit}`),

  alerts: (skip = 0, limit = 100) =>
    fetchApi<ListResponse<ActivityLog>>(`/api/activity/alerts?skip=${skip}&limit=${limit}`)
      .then(unwrapListResponse),

  scans: (params?: {
    skip?: number;
    limit?: number;
    inventory_item_id?: string;
    device_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.inventory_item_id) searchParams.set('inventory_item_id', params.inventory_item_id);
    if (params?.device_id) searchParams.set('device_id', params.device_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    const query = searchParams.toString();
    return fetchApi<ListResponse<ScanHistory>>(`/api/activity/scans${query ? `?${query}` : ''}`)
      .then(unwrapListResponse);
  },

  stats: () => fetchApi<Record<string, number>>('/api/activity/stats'),
};

// ============================================================================
// Dashboard API
// ============================================================================
export interface DashboardStats {
  total_items: number;
  total_value: number;
  items_scanned_today: number;
  active_alerts: number;
  locations: number;
  devices_online: number;
  low_stock_alerts: number;
  recent_activity: ActivityLog[];
}

export const dashboardApi = {
  stats: () => fetchApi<DashboardStats>('/api/dashboard/stats'),
};

// ============================================================================
// Scan API (for finding items by code)
// ============================================================================
export const scanApi = {
  findByCode: async (code: string): Promise<InventoryItem | null> => {
    try {
      // Try barcode first
      return await inventoryApi.getByBarcode(code);
    } catch {
      // Try searching by QR code data
      try {
        const items = await inventoryApi.list({ search: code });
        return items.length > 0 ? items[0] : null;
      } catch {
        return null;
      }
    }
  },
};

// ============================================================================
// Camera Captures API
// ============================================================================
export interface CameraCapture {
  id: string;
  device_id: string | null;
  location_id: string | null;
  image_url: string | null;
  video_url: string | null;
  image_base64: string | null;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  location_name: string | null;
  detected_objects: string | null;
  detected_count: number;
  is_alert: boolean;
  alert_type: string | null;
  captured_at: string;
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  device_name: string | null;
}

export interface CameraCaptureCreate {
  device_id?: string;
  location_id?: string;
  image_url?: string;
  video_url?: string;
  image_base64?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  location_name?: string;
  detected_count?: number;
  is_alert?: boolean;
  alert_type?: string;
  captured_at?: string;
}

export interface CameraCaptureUpdate {
  title?: string;
  description?: string;
  is_reviewed?: boolean;
  reviewed_by?: string;
}

export interface CameraCaptureListResponse {
  items: CameraCapture[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CameraCaptureFilters {
  page?: number;
  limit?: number;
  device_id?: string;
  location_id?: string;
  is_alert?: boolean;
  is_reviewed?: boolean;
  start_date?: string;
  end_date?: string;
}

export const cameraCapturesApi = {
  list: (params?: CameraCaptureFilters) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.device_id) searchParams.set('device_id', params.device_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.is_alert !== undefined) searchParams.set('is_alert', params.is_alert.toString());
    if (params?.is_reviewed !== undefined) searchParams.set('is_reviewed', params.is_reviewed.toString());
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    const query = searchParams.toString();
    return fetchApi<CameraCaptureListResponse>(`/api/camera-captures${query ? `?${query}` : ''}`);
  },

  get: (id: string) => fetchApi<CameraCapture>(`/api/camera-captures/${id}`),

  alerts: (limit: number = 50) => 
    fetchApi<CameraCapture[]>(`/api/camera-captures/alerts?limit=${limit}`),

  create: (data: CameraCaptureCreate) =>
    fetchApi<CameraCapture>('/api/camera-captures', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CameraCaptureUpdate) =>
    fetchApi<CameraCapture>(`/api/camera-captures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/camera-captures/${id}`, {
      method: 'DELETE',
    }),

  markReviewed: (id: string, reviewedBy?: string) =>
    fetchApi<CameraCapture>(`/api/camera-captures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_reviewed: true, reviewed_by: reviewedBy }),
    }),
};
