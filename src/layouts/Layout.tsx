import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  Package,
  History,
  MapPin,
  Cpu,
  LogOut,
  Menu,
  X,
  Warehouse,
  Bell,
  User,
  ChevronDown,
  Key,
  Camera,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AlertSystem } from '../components/AlertSystem';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { authApi } from '../lib/api';
import logo from "../assets/images/LOGOTRACKIFY.png";

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dasbor' },
  { to: '/scan', icon: QrCode, label: 'Pindai Kode QR' },
  { to: '/inventory', icon: Package, label: 'Inventaris' },
  { to: '/history', icon: History, label: 'Riwayat' },
  { to: '/locations', icon: MapPin, label: 'Lokasi' },
  { to: '/devices', icon: Cpu, label: 'Perangkat' },
  { to: '/camera-activity', icon: Camera, label: 'Aktivitas Kamera' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { activityLogs } = useWarehouseData();

  const activeAlerts = activityLogs.filter(
    (log) => log.is_alert && !dismissedAlerts.has(log.id)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Kata sandi minimal 6 karakter');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Kata sandi tidak cocok');
      return;
    }

    try {
      await authApi.changePassword(passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordSuccess(true);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setPasswordError(error.message || 'Gagal mengubah kata sandi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <AlertSystem alerts={activeAlerts} onDismiss={handleDismissAlert} />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-16 h-16" />
            {sidebarOpen && (
              <span className="text-xl font-bold text-white">Trackify</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {userMenuOpen && sidebarOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>Ubah Kata Sandi</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              Sistem Pelacakan Waktu Nyata
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Ubah Kata Sandi</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordError('');
                  setPasswordSuccess(false);
                  setPasswordForm({ newPassword: '', confirmPassword: '' });
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {passwordSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Key className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-400 font-medium">Kata sandi berhasil diubah!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Konfirmasi Kata Sandi
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Ulangi kata sandi baru"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-red-400 text-sm">{passwordError}</p>
                  )}
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Key className="w-5 h-5" />
                    Ubah Kata Sandi
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
