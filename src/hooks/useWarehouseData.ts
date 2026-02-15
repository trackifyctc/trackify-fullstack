import { useEffect, useState, useCallback } from 'react';
import { inventoryApi, activityApi, InventoryItem, ActivityLog, getAuthToken } from '../lib/api';

export function useWarehouseData() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      // Only fetch if authenticated
      if (!getAuthToken()) {
        setInventory([]);
        return;
      }
      const data = await inventoryApi.list({ limit: 500 });
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      // Don't set error for auth issues
      if (err instanceof Error && !err.message.includes('401')) {
        setError('Failed to load inventory');
      }
    }
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    try {
      if (!getAuthToken()) {
        setActivityLogs([]);
        return;
      }
      const data = await activityApi.recent(50);
      setActivityLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      if (err instanceof Error && !err.message.includes('401')) {
        setError('Failed to load activity logs');
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchInventory(), fetchActivityLogs()]);
    setLoading(false);
  }, [fetchInventory, fetchActivityLogs]);

  useEffect(() => {
    loadData();

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      if (getAuthToken()) {
        fetchInventory();
        fetchActivityLogs();
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [loadData, fetchInventory, fetchActivityLogs]);

  return {
    inventory,
    activityLogs,
    loading,
    error,
    refresh: loadData,
  };
}
