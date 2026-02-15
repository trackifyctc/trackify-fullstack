import { Package, AlertTriangle, Archive, TrendingUp, Bell } from 'lucide-react';
import type { InventoryItem } from '../lib/api';

interface DashboardProps {
  inventory: InventoryItem[];
  recentAlerts: number;
}

export function Dashboard({ inventory, recentAlerts }: DashboardProps) {
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const itemsInUse = inventory
    .filter(item => item.status === 'Berpindah')
    .reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = inventory
    .filter(item => item.status === 'Tersedia')
    .reduce((sum, item) => sum + item.quantity, 0);
  const damagedOrMissing = inventory
    .filter(item => item.status === 'Hilang')
    .reduce((sum, item) => sum + item.quantity, 0);

  const stats = [
    {
      label: 'Total Barang',
      value: totalItems,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-400',
    },
    {
      label: 'Tersedia',
      value: availableItems,
      icon: Archive,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-400',
    },
    {
      label: 'Berpindah',
      value: itemsInUse,
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-400',
    },
    {
      label: 'Hilang',
      value: damagedOrMissing,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-400',
    },
    {
      label: 'Peringatan',
      value: recentAlerts,
      icon: Bell,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
