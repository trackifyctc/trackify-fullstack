import { useEffect, useState, useCallback } from 'react';
import { inventoryApi, activityApi, InventoryItem, ActivityLog, getAuthToken, clearAuthToken } from '../lib/api';

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === 'object' && 'items' in (value as Record<string, unknown>)) {
    const items = (value as { items?: unknown }).items;
    return Array.isArray(items) ? (items as T[]) : [];
  }
  return [];
}

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
      setInventory(toArray<InventoryItem>(data));
    } catch (err) {
      console.error('Error fetching inventory:', err);
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Token expired, clear it
          clearAuthToken();
          throw new Error('Session expired. Please login again.');
        }
      }
      throw err;
    }
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    try {
      if (!getAuthToken()) {
        setActivityLogs([]);
        return;
      }
      const data = await activityApi.recent(50);
      setActivityLogs(toArray<ActivityLog>(data));
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Token expired, clear it
          clearAuthToken();
          throw new Error('Session expired. Please login again.');
        }
      }
      throw err;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchInventory(), fetchActivityLogs()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [fetchInventory, fetchActivityLogs]);

  useEffect(() => {
    if (getAuthToken()) {
      loadData();
    } else {
      setLoading(false);
    }

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      if (getAuthToken()) {
        Promise.all([fetchInventory(), fetchActivityLogs()]).catch(err => {
          console.error('Poll error:', err);
        });
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return {
    inventory,
    activityLogs,
    loading,
    error,
    refresh: loadData,
  };
}
