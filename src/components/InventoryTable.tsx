import { useState } from 'react';
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import type { InventoryItem, InventoryCreate, InventoryStatus } from '../lib/api';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onUpdate: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (item: InventoryCreate) => Promise<void>;
}

export function InventoryTable({ inventory, onUpdate, onDelete, onCreate }: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
  const [newItemForm, setNewItemForm] = useState<InventoryCreate>({
    name: '',
    barcode: '',
    location: '',
    status: 'Available',
    quantity: 1,
  });

  const statusColors: Record<InventoryStatus, string> = {
    Available: 'bg-green-500/20 text-green-400 border-green-500/30',
    Borrowed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Missing: 'bg-red-500/20 text-red-400 border-red-500/30',
    Damaged: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (editingId && editForm) {
      await onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleCreate = async () => {
    if (newItemForm.name && newItemForm.location) {
      await onCreate(newItemForm);
      setNewItemForm({
        name: '',
        barcode: '',
        location: '',
        status: 'Available',
        quantity: 1,
      });
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Item Inventaris</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Batal' : 'Tambah Item'}
        </button>
      </div>

      {showAddForm && (
        <div className="p-6 bg-gray-750 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Nama Item"
              value={newItemForm.name}
              onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Barcode"
              value={newItemForm.barcode || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, barcode: e.target.value })}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Lokasi"
              value={newItemForm.location}
              onChange={(e) => setNewItemForm({ ...newItemForm, location: e.target.value })}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newItemForm.status}
              onChange={(e) => setNewItemForm({ ...newItemForm, status: e.target.value as InventoryStatus })}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Available">Tersedia</option>
              <option value="Borrowed">Dipinjam</option>
              <option value="Missing">Hilang</option>
              <option value="Damaged">Rusak</option>
            </select>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Buat
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Nama</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Barcode</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Lokasi</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Jumlah</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {inventory.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className="hover:bg-gray-750/50 transition-colors">
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-white font-medium">{item.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.barcode || ''}
                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-400 font-mono text-sm">{item.barcode || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={
                          typeof editForm.location === 'object' && editForm.location?.name
                            ? editForm.location.name
                            : editForm.location || ''
                        }
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-full focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-300">
                        {typeof item.location === 'object' && item.location?.name
                          ? item.location.name
                          : item.location || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editForm.status || item.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as InventoryStatus })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="Available">Tersedia</option>
                        <option value="Borrowed">Dipinjam</option>
                        <option value="Missing">Hilang</option>
                        <option value="Damaged">Rusak</option>
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
                        onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-20 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-white">{item.quantity}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
