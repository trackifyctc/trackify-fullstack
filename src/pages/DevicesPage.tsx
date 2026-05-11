import { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  X,
  Save,
  Wifi,
  WifiOff,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { devicesApi, Device, DeviceCreate, DeviceType, getAuthToken, locationsApi, Location } from '../lib/api';

const deviceTypes: { value: DeviceType; label: string }[] = [
  { value: 'scanner', label: 'Pemindai Barcode/RFID' },
  { value: 'sensor', label: 'Sensor (Suhu/Gerakan)' },
  { value: 'camera', label: 'Sistem Kamera' },
  { value: 'gateway', label: 'Gateway/Hub' },
];

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Set<string>>(new Set());
  const [newDevice, setNewDevice] = useState<DeviceCreate>({
    name: '',
    device_type: 'scanner',
    serial_number: '',
    location_id: '',
  });

  const fetchDevices = useCallback(async () => {
    if (!getAuthToken()) {
      setDevices([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await devicesApi.list();
      setDevices(data || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Gagal memuat perangkat');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationsApi.list();
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchLocations();
  }, [fetchDevices, fetchLocations]);

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.serial_number) {
      alert('Nama dan serial number harus diisi');
      return;
    }

    try {
      await devicesApi.create(newDevice);
      setNewDevice({ name: '', device_type: 'scanner', serial_number: '', location_id: '' });
      setShowAddForm(false);
      await fetchDevices();
    } catch (err) {
      console.error('Error creating device:', err);
      alert('Gagal mendaftarkan perangkat');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Yakin ingin menghapus perangkat? API key akan dinonaktifkan.')) return;
    
    try {
      await devicesApi.delete(id);
      await fetchDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Gagal menghapus perangkat');
    }
  };

  const handleRegenerateApiKey = async (id: string) => {
    if (!confirm('Generate ulang API key? Key saat ini tidak akan berfungsi lagi.')) return;
    
    try {
      await devicesApi.regenerateKey(id);
      await fetchDevices();
    } catch (err) {
      console.error('Error regenerating API key:', err);
      alert('Gagal generate ulang API key');
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Tidak pernah';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Perangkat</h1>
          <p className="text-gray-400">Kelola perangkat IoT dan integrasi API</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Segarkan
          </button>
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Dokumentasi API
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Batal' : 'Tambah Perangkat'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* API Documentation Modal */}
      {showApiDocs && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Dokumentasi API Perangkat
          </h2>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-gray-400 mb-2">URL Basis:</p>
              <code className="text-green-400">https://api.trackify.com/v1/devices</code>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-white font-semibold mb-2">Kirim Peringatan</p>
              <p className="text-gray-400 mb-2">POST /alert</p>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "api_key": "your_device_api_key",
  "alert_type": "motion | temperature | humidity | unauthorized",
  "severity": "low | medium | high | critical",
  "message": "Alert description",
  "data": {
    "temperature": 32.5,
    "location": "Zone A"
  }
}`}
              </pre>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-white font-semibold mb-2">Detak Jantung / Pembaruan Status</p>
              <p className="text-gray-400 mb-2">POST /heartbeat</p>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "api_key": "your_device_api_key",
  "status": "online | offline | warning",
  "firmware_version": "2.1.0",
  "ip_address": "192.168.1.100",
  "metrics": {
    "cpu": 45,
    "memory": 60,
    "uptime": 3600
  }
}`}
              </pre>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-white font-semibold mb-2">Pindai Item</p>
              <p className="text-gray-400 mb-2">POST /scan</p>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "api_key": "your_device_api_key",
  "scan_type": "qr | barcode | rfid",
  "code": "TRK-ABC123",
  "location": "Warehouse A"
}`}
              </pre>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 font-semibold mb-2">⚠️ Autentikasi</p>
              <p className="text-gray-300 text-xs">
                Sertakan kunci API dalam badan permintaan. Jaga keamanan kunci API Anda dan jangan pernah memposting kode sisi klien.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Daftarkan Perangkat Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Nama Perangkat *"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newDevice.device_type}
              onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value as DeviceType })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {deviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nomor Serial *"
              value={newDevice.serial_number}
              onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newDevice.location_id || ''}
              onChange={(e) => setNewDevice({ ...newDevice, location_id: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Pilih Lokasi</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddDevice}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Daftar
            </button>
          </div>
        </div>
      )}

      {/* Device Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Total Perangkat</p>
          <p className="text-2xl font-bold text-white">{devices.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Online</p>
          <p className="text-2xl font-bold text-green-400">
            {devices.filter((d) => d.status === 'online').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Peringatan</p>
          <p className="text-2xl font-bold text-amber-400">
            {devices.filter((d) => d.status === 'warning').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Offline</p>
          <p className="text-2xl font-bold text-red-400">
            {devices.filter((d) => d.status === 'offline').length}
          </p>
        </div>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Cpu className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Belum ada perangkat terdaftar. Tambahkan perangkat baru.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Cpu className="w-6 h-6 text-blue-400" />
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(
                        device.status
                      )} ring-2 ring-gray-800`}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{device.name}</h3>
                    <p className="text-gray-500 text-sm">{device.serial_number}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleRegenerateApiKey(device.id)}
                    className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Buat Ulang Kunci API"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus Perangkat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Tipe</p>
                  <p className="text-gray-300">
                    {deviceTypes.find((t) => t.value === device.device_type)?.label || device.device_type}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Lokasi</p>
                  <p className="text-gray-300">
                    {typeof device.location === 'object' && device.location?.name
                      ? device.location.name
                      : typeof device.location === 'string'
                      ? device.location
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Terakhir Dilihat</p>
                  <p className="text-gray-300">{formatLastSeen(device.last_heartbeat)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Firmware</p>
                  <p className="text-gray-300">{device.firmware_version || '-'}</p>
                </div>
              </div>

              {/* API Key Section */}
              <div className="p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-xs">Kunci API</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleApiKeyVisibility(device.id)}
                      className="p-1 text-gray-400 hover:text-gray-300"
                    >
                      {showApiKey.has(device.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyApiKey(device.api_key)}
                      className="p-1 text-gray-400 hover:text-gray-300"
                    >
                      {copiedKey === device.api_key ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <code className="text-xs text-green-400 break-all">
                  {showApiKey.has(device.id)
                    ? device.api_key
                    : device.api_key.substring(0, 8) + '••••••••••••••••••••••••'}
                </code>
              </div>
            </div>

            {/* Status Bar */}
            <div
              className={`px-5 py-2 text-sm font-medium flex items-center gap-2 ${
                device.status === 'online'
                  ? 'bg-green-500/10 text-green-400'
                  : device.status === 'warning'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {device.status === 'online' ? (
                <Wifi className="w-4 h-4" />
              ) : device.status === 'warning' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="capitalize">{device.status}</span>
              {device.ip_address && (
                <span className="text-gray-500 ml-auto">{device.ip_address}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
