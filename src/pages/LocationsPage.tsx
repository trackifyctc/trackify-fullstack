import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, X, Save, Trash2, Package, Layers, RefreshCw } from 'lucide-react';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { locationsApi, Location, LocationCreate, getAuthToken } from '../lib/api';

export function LocationsPage() {
  const { inventory } = useWarehouseData();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<LocationCreate>({
    name: '',
    code: '',
    floor: '',
    zone: '',
    capacity: 100,
  });

  const fetchLocations = useCallback(async () => {
    if (!getAuthToken()) {
      setLocations([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await locationsApi.list();
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Gagal memuat lokasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Get items count per location
  const getItemsInLocation = (locationId: string) => {
    return inventory.filter((item) => item.location_id === locationId).length;
  };

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.code) {
      alert('Nama dan kode lokasi harus diisi');
      return;
    }

    try {
      await locationsApi.create(newLocation);
      setNewLocation({ name: '', code: '', floor: '', zone: '', capacity: 100 });
      setShowAddForm(false);
      await fetchLocations();
    } catch (err) {
      console.error('Error creating location:', err);
      alert('Gagal membuat lokasi');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lokasi ini?')) return;
    
    try {
      await locationsApi.delete(id);
      await fetchLocations();
      if (selectedLocation === id) {
        setSelectedLocation(null);
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Gagal menghapus lokasi');
    }
  };

  const selectedLocationData = selectedLocation
    ? locations.find((l) => l.id === selectedLocation)
    : null;

  const itemsInSelectedLocation = selectedLocationData
    ? inventory.filter((item) => item.location_id === selectedLocationData.id)
    : [];

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
          <h1 className="text-2xl font-bold text-white mb-2">Lokasi</h1>
          <p className="text-gray-400">Kelola lokasi dan zona gudang</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchLocations}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Batal' : 'Tambah Lokasi'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tambah Lokasi Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Nama Lokasi *"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Kode *"
              value={newLocation.code}
              onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Lantai"
              value={newLocation.floor || ''}
              onChange={(e) => setNewLocation({ ...newLocation, floor: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Zona"
              value={newLocation.zone || ''}
              onChange={(e) => setNewLocation({ ...newLocation, zone: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddLocation}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location List */}
        <div className="lg:col-span-2 space-y-4">
          {locations.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Belum ada lokasi. Tambahkan lokasi baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((location) => {
                const itemsCount = getItemsInLocation(location.id);
                const capacity = location.capacity || 100;
                const capacityPercent = Math.round((itemsCount / capacity) * 100);

              return (
                <div
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`bg-gray-800 rounded-xl border transition-all cursor-pointer ${
                    selectedLocation === location.id
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <MapPin className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{location.name}</h3>
                          <p className="text-gray-500 text-sm font-mono">{location.code}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id);
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Lantai</p>
                        <p className="text-white">{location.floor || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Zona</p>
                        <p className="text-white">{location.zone || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Kapasitas</span>
                        <span className="text-white">
                          {itemsCount} / {capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capacityPercent > 80
                              ? 'bg-red-500'
                              : capacityPercent > 50
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          {selectedLocationData ? (
            <>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Detail Lokasi
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <MapPin className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedLocationData.name}
                      </h3>
                      <p className="text-gray-400 font-mono">
                        {selectedLocationData.code}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-500">Lantai</p>
                      <p className="text-white font-medium">
                        {selectedLocationData.floor || '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-500">Zona</p>
                      <p className="text-white font-medium">
                        {selectedLocationData.zone || '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-500">Kapasitas</p>
                      <p className="text-white font-medium">
                        {selectedLocationData.capacity || 100} barang
                      </p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-500">Barang Saat Ini</p>
                      <p className="text-white font-medium">
                        {itemsInSelectedLocation.length} barang
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Barang di Lokasi
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {itemsInSelectedLocation.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                      {itemsInSelectedLocation.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-750/50">
                          <p className="text-white font-medium">{item.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>Qty: {item.quantity}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                item.status === 'TERSEDIA'
                                  ? 'bg-green-500/20 text-green-400'
                                  : item.status === 'BERPINDAH'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : item.status === 'HILANG'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Tidak ada barang di lokasi ini</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Pilih lokasi untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
