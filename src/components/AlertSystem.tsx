import { useEffect, useState } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';
import type { ActivityLog } from '../lib/api';

interface AlertSystemProps {
  alerts: ActivityLog[];
  onDismiss: (id: string) => void;
}

export function AlertSystem({ alerts, onDismiss }: AlertSystemProps) {
  const [activeAlerts, setActiveAlerts] = useState<ActivityLog[]>([]);

  const getUserDisplay = (user: unknown) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const typedUser = user as { full_name?: string | null; name?: string | null; email?: string | null };
      return typedUser.full_name || typedUser.name || typedUser.email || 'System';
    }
    return 'System';
  };

  useEffect(() => {
    setActiveAlerts(alerts.filter(alert => alert.is_alert));
  }, [alerts]);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
        {activeAlerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className="bg-red-500/95 backdrop-blur-sm border-2 border-red-400 rounded-lg shadow-2xl overflow-hidden animate-slide-in"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-white animate-bounce" />
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">
                      Security Alert
                    </h4>
                  </div>
                  <p className="text-white font-semibold mb-2">{alert.action}</p>
                  <div className="space-y-1 text-sm text-red-50">
                    {alert.location && (
                      <p>Location: {typeof alert.location === 'object' && alert.location.name ? alert.location.name : alert.location}</p>
                    )}
                    <p>User: {getUserDisplay(alert.user)}</p>
                    <p className="text-xs text-red-100">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="flex-shrink-0 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="h-1 bg-white/30">
              <div className="h-full bg-white animate-alert-timer" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes alert-timer {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-alert-timer {
          animation: alert-timer 10s linear;
        }
      `}</style>
    </>
  );
}
