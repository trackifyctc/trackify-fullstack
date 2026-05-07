import { useEffect } from 'react';
import { Package, AlertTriangle, Archive, TrendingUp, MapPin, Cpu, QrCode, Activity } from 'lucide-react';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { inventory, activityLogs, loading, error } = useWarehouseData();
  
  useEffect(() => {
    console.log('DashboardPage mounted/updated:', { loading, error, inventoryCount: inventory.length, logsCount: activityLogs.length });
  }, [loading, error, inventory.length, activityLogs.length]);

  const inventoryItems = Array.isArray(inventory) ? inventory : [];

  const getUserDisplay = (user: unknown) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const typedUser = user as { full_name?: string | null; name?: string | null; email?: string | null };
      return typedUser.full_name || typedUser.name || typedUser.email || 'System';
    }
    return 'System';
  };

  const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsInUse = inventoryItems
    .filter((item) => item.status === 'BERPINDAH')
    .reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = inventoryItems
    .filter((item) => item.status === 'TERSEDIA')
    .reduce((sum, item) => sum + item.quantity, 0);
  const recentAlerts = activityLogs.filter((log) => log.is_alert).length;

  const stats = [
    {
      label: 'Total Barang',
      value: totalItems,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-400',
      link: '/inventory',
    },
    {
      label: 'Tersedia',
      value: availableItems,
      icon: Archive,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-400',
      link: '/inventory',
    },
    {
      label: 'Berpindah',
      value: itemsInUse,
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-400',
      link: '/inventory',
    },
    {
      label: 'Peringatan Aktif',
      value: recentAlerts,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-400',
      link: '/history',
    },
  ];

  const quickActions = [
    {
      label: 'Scan QR Code',
      description: 'Scan item barcode/QR',
      icon: QrCode,
      link: '/scan',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'View Inventory',
      description: 'Manage all items',
      icon: Package,
      link: '/inventory',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      label: 'Locations',
      description: 'Manage zones',
      icon: MapPin,
      link: '/locations',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      label: 'Devices',
      description: 'Manage IoT devices',
      icon: Cpu,
      link: '/devices',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your warehouse inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.link}
                className={`${action.color} rounded-lg p-4 transition-colors text-white`}
              >
                <Icon className="w-8 h-8 mb-3" />
                <p className="font-semibold">{action.label}</p>
                <p className="text-sm text-white/70">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Activity
            </h2>
            <Link
              to="/history"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg ${
                  log.is_alert
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{log.action}</p>
                    <p className="text-xs text-gray-400">
                      {getUserDisplay(log.user)} • {log.location || 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Items Needing Attention
            </h2>
            <Link
              to="/inventory"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {inventoryItems
              .filter(
                (item) =>
                  item.status === 'Hilang' ||
                  item.status === 'Diperbarui' ||
                  item.quantity <= 5
              )
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-gray-700/50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {typeof item.location === 'object' && item.location?.name
                        ? item.location.name
                        : item.location || '-'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'Hilang'
                        ? 'bg-red-500/20 text-red-400'
                        : item.status === 'Diperbarui'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.status === 'Hilang' || item.status === 'Diperbarui'
                      ? item.status
                      : `Qty: ${item.quantity}`}
                  </span>
                </div>
              ))}
            {inventory.filter(
              (item) =>
                item.status === 'Hilang' ||
                item.status === 'Diperbarui' ||
                item.quantity <= 5
            ).length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Semua barang dalam kondisi baik
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
