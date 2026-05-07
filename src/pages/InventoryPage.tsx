import { useState, useMemo, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Save, QrCode, Download, Search, Filter, Eye } from 'lucide-react';
import QRCode from 'qrcode';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { inventoryApi, InventoryItem, InventoryStatus, InventoryCreate, locationsApi, Location } from '../lib/api';

// Generate unique QR code for item
const generateQRCode = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TRK-${timestamp}-${random}`.toUpperCase();
};

export function InventoryPage() {
  const { inventory, refresh, loading } = useWarehouseData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);
  const [newItemForm, setNewItemForm] = useState<Partial<InventoryCreate>>({
    name: '',
    barcode: '',
    location_id: '',
    quantity: 1,
    category: '',
    description: '',
    sku: '',
  });

  // Fetch locations from database
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await locationsApi.list();
        setLocations(data);
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, []);

  // Get unique categories from inventory
  const categories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [inventory]);

  const statusColors: Record<InventoryStatus, string> = {
    TERSEDIA: 'bg-green-500/20 text-green-400 border-green-500/30',
    DIPERBARUI: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    BERPINDAH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HILANG: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  // Filter inventory based on search, status, and category
  const filteredInventory = inventory.filter((item) => {
    const locationStr = typeof item.location === 'object' && item.location?.name ? item.location.name : (typeof item.location === 'string' ? item.location : '');
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Show item detail
  const showItemDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Generate QR code image - simplified to just use SKU for easier scanning
  const generateQRCodeImage = async (item: InventoryItem) => {
    try {
      const qrData = item.sku || item.qr_code || generateQRCode();
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'L', // Lower error correction = simpler QR
      });
      setQrCodeDataUrl(dataUrl);
      setSelectedItem(item);
      setShowQRModal(true);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !selectedItem) return;
    const link = document.createElement('a');
    link.download = `QR-${selectedItem.name.replace(/\s+/g, '-')}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const handleUpdate = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      // Only send fields that UpdateInventoryDto accepts: name, description, quantity, status, location_id
      const filteredUpdates: Record<string, any> = {};
      
      if (updates.name !== undefined && updates.name !== '') filteredUpdates.name = updates.name;
      if (updates.description !== undefined) filteredUpdates.description = updates.description;
      if (updates.quantity !== undefined) filteredUpdates.quantity = updates.quantity;
      if (updates.status !== undefined && updates.status !== '') filteredUpdates.status = updates.status;
      if (updates.location_id !== undefined && updates.location_id !== '') filteredUpdates.location_id = updates.location_id;

      console.log('Sending update payload:', filteredUpdates);
      await inventoryApi.update(id, filteredUpdates);
      await refresh();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await inventoryApi.delete(id);
      await refresh();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete item');
    }
  };

  const handleCreate = async () => {
    if (!newItemForm.name || !newItemForm.location_id) {
      alert('Please fill in required fields (Name and Location)');
      return;
    }

    try {
      // Backend expects SKU. If not provided, generate from name and location.
      const sku = newItemForm.sku || `SKU-${newItemForm.name.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      const payload = {
        name: newItemForm.name,
        description: newItemForm.description,
        sku: sku,
        barcode: newItemForm.barcode,
        location_id: newItemForm.location_id,
        category: newItemForm.category,
        quantity: newItemForm.quantity,
      };

      await inventoryApi.create(payload);

      setNewItemForm({
        name: '',
        barcode: '',
        location_id: '',
        quantity: 1,
        category: '',
        description: '',
        sku: '',
      });
      setShowAddForm(false);
      await refresh();
    } catch (err) {
      console.error('Create error:', err);
      alert('Failed to create item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm(item);
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
          <h1 className="text-2xl font-bold text-white mb-2">Inventaris</h1>
          <p className="text-gray-400">Manage your warehouse inventory items</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Item Name *"
              value={newItemForm.name}
              onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Barcode (Optional)"
              value={newItemForm.barcode || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, barcode: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newItemForm.location_id || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, location_id: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Pilih Lokasi *</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Category"
              value={newItemForm.category || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="SKU"
              value={newItemForm.sku || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Quantity"
              min="1"
              value={newItemForm.quantity}
              onChange={(e) => setNewItemForm({ ...newItemForm, quantity: parseInt(e.target.value) || 1 })}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mt-4">
            <textarea
              placeholder="Description"
              value={newItemForm.description || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Create Item
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InventoryStatus | 'all')}
            className="pl-11 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="TERSEDIA">Tersedia</option>
            <option value="DIPERBARUI">Diperbarui</option>
            <option value="BERPINDAH">Berpindah</option>
            <option value="HILANG">Hilang</option>
          </select>
        </div>
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Nama</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Lokasi</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Kategori</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Qty</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">QR Code</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInventory.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-750/50 transition-colors">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div>
                          <span className="text-white font-medium">{item.name}</span>
                          {item.barcode && (
                            <p className="text-xs text-gray-500 font-mono mt-1">{item.barcode}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editForm.location_id || item.location_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Pilih Lokasi</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-300">{typeof item.location === 'object' && item.location?.name ? item.location.name : item.location}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-gray-300">{item.category || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editForm.status || item.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as InventoryStatus })}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="TERSEDIA">Tersedia</option>
                          <option value="DIPERBARUI">Diperbarui</option>
                          <option value="BERPINDAH">Berpindah</option>
                          <option value="HILANG">Hilang</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.quantity || 0}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm w-20 focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-gray-300">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => generateQRCodeImage(item)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdate(item.id, editForm)}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditForm({});
                              }}
                              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => showItemDetail(item)}
                              className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada barang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{selectedItem.name}</p>
                <p className="text-gray-400 text-sm">
                  {typeof selectedItem.location === 'object' && selectedItem.location?.name
                    ? selectedItem.location.name
                    : selectedItem.location || '-'}
                </p>
                <p className="text-gray-500 text-xs mt-2 font-mono">
                  {selectedItem.sku || selectedItem.qr_code || 'N/A'}
                </p>
              </div>
              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Detail Barang</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Item Header */}
              <div className="flex items-start gap-4">
                {selectedItem.image_url ? (
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.name}
                    className="w-24 h-24 rounded-lg object-cover bg-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl text-gray-500">📦</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-white">{selectedItem.name}</h4>
                  <p className="text-gray-400 text-sm mt-1">{selectedItem.description || 'Tidak ada deskripsi'}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[selectedItem.status]}`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">SKU</p>
                  <p className="text-white font-mono mt-1">{selectedItem.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Barcode</p>
                  <p className="text-white font-mono mt-1">{selectedItem.barcode || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Kategori</p>
                  <p className="text-white mt-1">{selectedItem.category || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Lokasi</p>
                  <p className="text-white mt-1">
                    {typeof selectedItem.location === 'object' && selectedItem.location?.name
                      ? selectedItem.location.name
                      : selectedItem.location || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Jumlah</p>
                  <p className="text-white mt-1">{selectedItem.quantity} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Min / Max</p>
                  <p className="text-white mt-1">{selectedItem.min_quantity} / {selectedItem.max_quantity || '∞'}</p>
                </div>
                {selectedItem.price && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Harga</p>
                    <p className="text-white mt-1">Rp {selectedItem.price.toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>

              {/* Scan Info */}
              {selectedItem.last_scanned_at && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Terakhir Dipindai</p>
                  <p className="text-white mt-1">
                    {new Date(selectedItem.last_scanned_at).toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    generateQRCodeImage(selectedItem);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Lihat QR Code
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(selectedItem);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
