import { Clock, User, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ActivityLog } from '../lib/api';

interface ActivityLogsProps {
  logs: ActivityLog[];
}

export function ActivityLogs({ logs }: ActivityLogsProps) {
  const getUserDisplay = (user: unknown) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      const typedUser = user as { full_name?: string | null; name?: string | null; email?: string | null };
      return typedUser.full_name || typedUser.name || typedUser.email || 'System';
    }
    return 'System';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          Activity History
        </h2>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 hover:bg-gray-750/50 transition-colors ${
                  log.is_alert ? 'bg-red-500/5 border-l-4 border-red-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${
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
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-white font-medium">{log.action}</p>
                        {log.is_alert && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            UNAUTHORIZED MOVEMENT DETECTED
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{getUserDisplay(log.user)}</span>
                      </div>

                      {log.location && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {typeof log.location === 'object' && log.location?.name
                              ? log.location.name
                              : log.location}
                          </span>
                        </div>
                      )}

                      {log.has_barcode_scan && (
                        <div className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Barcode Scanned</span>
                        </div>
                      )}
                    </div>

                    {log.details && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="text-gray-400">{log.details}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
