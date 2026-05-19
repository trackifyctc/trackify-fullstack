import { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  Calendar,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cameraCapturesApi, CameraCapture, CameraCaptureFilters, devicesApi, Device, getAuthToken } from '../lib/api';

export function CameraActivityPage() {
  const [captures, setCaptures] = useState<CameraCapture[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<CameraCapture | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CameraCaptureFilters>({
    page: 1,
    limit: 12,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'alerts' | 'normal'>('all');

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchDevices = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const data = await devicesApi.list();
      // Filter only camera devices
      setDevices(data.filter(d => d.device_type === 'camera') || data);
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  }, []);

  const fetchCaptures = useCallback(async () => {
    if (!getAuthToken()) {
      setCaptures([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const params: CameraCaptureFilters = {
        ...filters,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        device_id: selectedDevice || undefined,
        is_alert: alertFilter === 'all' ? undefined : alertFilter === 'alerts',
      };

      const response = await cameraCapturesApi.list(params);
      setCaptures(response.items || []);
      setTotalPages(response.pages || 1);
      setTotalItems(response.total || 0);
    } catch (err) {
      console.error('Error fetching captures:', err);
      setError('Gagal memuat data aktivitas kamera');
    } finally {
      setLoading(false);
    }
  }, [filters, startDate, endDate, selectedDevice, alertFilter]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetchCaptures();
  }, [fetchCaptures]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchCaptures();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const openDetail = (capture: CameraCapture) => {
    setSelectedCapture(capture);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedCapture(null);
    setShowDetailModal(false);
  };

  const handleMarkReviewed = async (id: string) => {
    try {
      await cameraCapturesApi.markReviewed(id);
      fetchCaptures();
      if (selectedCapture && selectedCapture.id === id) {
        setSelectedCapture({ ...selectedCapture, is_reviewed: true });
      }
    } catch (err) {
      console.error('Error marking as reviewed:', err);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && captures.length === 0) {
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
          <h1 className="text-2xl font-bold text-white mb-2">Riwayat Aktivitas Kamera</h1>
          <p className="text-gray-400">
            Lihat tangkapan dari kamera perangkat (Raspberry Pi)
          </p>
        </div>
        <button
          onClick={fetchCaptures}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Segarkan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Device Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Perangkat</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Perangkat</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipe</label>
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as 'all' | 'alerts' | 'normal')}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua</option>
              <option value="alerts">Peringatan Saja</option>
              <option value="normal">Normal Saja</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              Cari
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Total Tangkapan</p>
          <p className="text-2xl font-bold text-white">{totalItems}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Peringatan</p>
          <p className="text-2xl font-bold text-red-400">
            {captures.filter(c => c.is_alert).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Belum Diperiksa</p>
          <p className="text-2xl font-bold text-amber-400">
            {captures.filter(c => !c.is_reviewed).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Perangkat Aktif</p>
          <p className="text-2xl font-bold text-green-400">{devices.length}</p>
        </div>
      </div>

      {/* Captures Grid */}
      {captures.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">Belum ada tangkapan kamera</p>
          <p className="text-gray-500 text-sm mt-2">
            Tangkapan dari perangkat kamera akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {captures.map((capture) => (
            <div
              key={capture.id}
              onClick={() => openDetail(capture)}
              className={`bg-gray-800 rounded-xl border overflow-hidden cursor-pointer transition-all hover:border-blue-500 ${
                capture.is_alert ? 'border-red-500/50' : 'border-gray-700'
              }`}
            >
      {/* Image */}
      <div className="aspect-video bg-gray-900 relative">
        {capture.image_url || capture.image_base64 ? (
          <>
            <img
              src={capture.image_url || capture.image_base64 || undefined}
              alt={capture.title || 'Capture'}
              className="w-full h-full object-cover"
            />

            {capture.video_url && (
              <video
                controls
                className="w-full mt-2 rounded-lg"
              >
                <source src={capture.video_url} />
              </video>
            )}
          </>
        ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-600" />
            </div>
        )}

        {/* Alert Badge */}
        {capture.is_alert && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {capture.alert_type || 'Peringatan'}
          </div>
        )}

        {/* Reviewed Badge */}
        {capture.is_reviewed && (
          <div className="absolute top-2 left-2 p-1 bg-green-500 rounded-full">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-medium truncate">
                  {capture.title || 'Tangkapan Kamera'}
                </h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Cpu className="w-4 h-4" />
                    <span className="truncate">{capture.device_name || 'Perangkat Tidak Diketahui'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{capture.location_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(capture.captured_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(filters.page! - 1)}
            disabled={filters.page === 1}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="px-4 py-2 text-gray-400">
            Halaman {filters.page} dari {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(filters.page! + 1)}
            disabled={filters.page === totalPages}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCapture && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                Detail Aktivitas Kamera
              </h2>
              <button
                onClick={closeDetail}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  {selectedCapture.image_url || selectedCapture.image_base64 ? (
                    <img
                      src={selectedCapture.image_url || selectedCapture.image_base64 || undefined}
                      alt={selectedCapture.title || 'Capture'}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <Camera className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {/* Alert Badge */}
                  {selectedCapture.is_alert && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">
                          {selectedCapture.alert_type?.toUpperCase() || 'PERINGATAN'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="text-sm text-gray-500">Judul</label>
                    <p className="text-white text-lg font-medium">
                      {selectedCapture.title || 'Tangkapan Kamera'}
                    </p>
                  </div>

                  {/* Device */}
                  <div>
                    <label className="text-sm text-gray-500">Perangkat</label>
                    <p className="text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      {selectedCapture.device_name || 'Tidak Diketahui'}
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm text-gray-500">Lokasi</label>
                    <p className="text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      {selectedCapture.location_name || '-'}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div>
                    <label className="text-sm text-gray-500">Waktu Tangkapan</label>
                    <p className="text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      {formatDateTime(selectedCapture.captured_at)}
                    </p>
                  </div>

                  {/* Description */}
                  {selectedCapture.description && (
                    <div>
                      <label className="text-sm text-gray-500">Deskripsi</label>
                      <p className="text-gray-300">{selectedCapture.description}</p>
                    </div>
                  )}

                  {/* Detected Objects */}
                  {selectedCapture.detected_objects && (
                    <div>
                      <label className="text-sm text-gray-500">Objek Terdeteksi</label>
                      <p className="text-gray-300">
                        {selectedCapture.detected_count} objek
                      </p>
                    </div>
                  )}

                  {/* Review Status */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-gray-500">Status Review</label>
                        {selectedCapture.is_reviewed ? (
                          <p className="text-green-400 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Sudah diperiksa oleh {selectedCapture.reviewed_by}
                          </p>
                        ) : (
                          <p className="text-amber-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Belum diperiksa
                          </p>
                        )}
                      </div>
                      
                      {!selectedCapture.is_reviewed && (
                        <button
                          onClick={() => handleMarkReviewed(selectedCapture.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Tandai Diperiksa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
