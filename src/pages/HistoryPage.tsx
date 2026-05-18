import { useState } from 'react';
import { Clock, User, MapPin, AlertTriangle, CheckCircle, Search, Filter, Download, Calendar } from 'lucide-react';
import { useWarehouseData } from '../hooks/useWarehouseData';

export function HistoryPage() {
  const { activityLogs, loading } = useWarehouseData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alerts' | 'scans' | 'updates'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const getUserDisplay = (user: unknown) => {
    if (!user) return 'Sistem';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const typedUser = user as { full_name?: string; name?: string; email?: string };
      return typedUser.full_name || typedUser.name || typedUser.email || 'Sistem';
    }
    return 'Sistem';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter logs
  const filteredLogs = activityLogs.filter((log) => {
    // Search filter
    const userDisplay = getUserDisplay(log.user).toLowerCase();
    const locationName = log.location && typeof log.location === 'object' ? log.location.name : (typeof log.location === 'string' ? log.location : '');
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userDisplay.includes(searchQuery.toLowerCase()) ||
      (locationName && locationName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Type filter
    let matchesType = true;
    if (filterType === 'alerts') matchesType = log.is_alert;
    if (filterType === 'scans') matchesType = log.has_barcode_scan;
    if (filterType === 'updates') matchesType = !log.is_alert && !log.has_barcode_scan;

    // Date filter
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = new Date(log.created_at) >= new Date(dateRange.start);
    }
    if (dateRange.end && matchesDate) {
      matchesDate = new Date(log.created_at) <= new Date(dateRange.end + 'T23:59:59');
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Export logs to CSV
  const exportToCSV = () => {
    const headers = ['Waktu', 'Tindakan', 'Pengguna', 'Lokasi', 'Tipe', 'Peringatan'];
    const rows = filteredLogs.map((log) => [
      formatTime(log.created_at),
      log.action,
      getUserDisplay(log.user),
      log.location || '-',
      log.has_barcode_scan ? 'Scan' : 'Sistem',
      log.is_alert ? 'Ya' : 'Tidak',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-2xl font-bold text-white mb-2">Riwayat</h1>
          <p className="text-gray-400">Lihat semua log aktivitas dan scan</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Ekspor CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Cari log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="all">Semua Tipe</option>
              <option value="alerts">Hanya Peringatan</option>
              <option value="updates">Hanya Pembaruan</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Total Log</p>
          <p className="text-2xl font-bold text-white">{activityLogs.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Peringatan</p>
          <p className="text-2xl font-bold text-red-400">
            {activityLogs.filter((l) => l.is_alert).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Difilter</p>
          <p className="text-2xl font-bold text-blue-400">{filteredLogs.length}</p>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Log Aktivitas
          </h2>
        </div>

        <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 hover:bg-gray-750/50 transition-colors ${
                log.is_alert ? 'bg-red-500/5 border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    log.is_alert
                      ? 'bg-red-500/20 text-red-400'
                      : log.has_barcode_scan
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {log.is_alert ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : log.has_barcode_scan ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">{log.action}</p>
                      {log.is_alert && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          PERINGATAN
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{getUserDisplay(log.user)}</span>
                    </div>
                    {log.location && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {typeof log.location === 'object' && log.location.name
                            ? log.location.name
                            : log.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {log.details && (
                    <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-400 font-mono">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada log aktivitas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
