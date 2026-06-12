import { useState, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Loader,
} from 'lucide-react';
import { devicesApi, Device, ServoCommand } from '../lib/api';

interface ServoControlPanelProps {
  device: Device;
  onCommandSent?: (command: ServoCommand) => void;
}

export function ServoControlPanel({ device, onCommandSent }: ServoControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [lastCommand, setLastCommand] = useState<ServoCommand | null>(null);
  const [history, setHistory] = useState<ServoCommand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAngle, setSelectedAngle] = useState(30);

  useEffect(() => {
    loadHistory();
  }, [device.id]);

  const loadHistory = async () => {
    try {
      const data = await devicesApi.getServoHistory(device.id);
      setHistory(data);
      if (data.length > 0) {
        setLastCommand(data[0]);
      }
    } catch (err) {
      console.error('Error loading servo history:', err);
    }
  };

  const sendCommand = async (direction: 'up' | 'down' | 'left' | 'right' | 'reset') => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const angle = direction === 'reset' ? 0 : selectedAngle;
      const command = await devicesApi.sendServoCommand(device.id, direction, angle);
      
      setLastCommand(command);
      setHistory([command, ...history]);
      
      if (onCommandSent) {
        onCommandSent(command);
      }

      // Notifikasi sukses
      console.log(`Servo ${direction.toUpperCase()} command sent successfully!`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim perintah servo';
      setError(errorMsg);
      console.error('Servo command error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">🎥 Kontrol Servo Kamera</h3>
      
      {/* Status Device */}
      <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-sm text-gray-700">
          Device: <span className="font-semibold">{device.name}</span>
        </p>
        <p className="text-sm text-gray-700">
          Status: <span className={`font-semibold ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
            {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
          </span>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Angle Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sudut Pergerakan: <span className="text-blue-600 font-bold">{selectedAngle}°</span>
        </label>
        <input
          type="range"
          min="5"
          max="90"
          step="5"
          value={selectedAngle}
          onChange={(e) => setSelectedAngle(parseInt(e.target.value))}
          className="w-full"disabled={loading}
          
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>5°</span>
          <span>90°</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {/* Top empty cell */}
        <div></div>
        {/* UP */}
        <button
          onClick={() => sendCommand('up')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-lg flex items-center justify-center transition"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-6 h-6" />}
        </button>
        {/* Top empty cell */}
        <div></div>

        {/* LEFT */}
        <button
          onClick={() => sendCommand('left')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-lg flex items-center justify-center transition"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-6 h-6" />}
        </button>
        {/* RESET CENTER */}
        <button
          onClick={() => sendCommand('reset')}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white p-3 rounded-lg flex items-center justify-center transition"
          title="Reset ke posisi awal"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
        </button>
        {/* RIGHT */}
        <button
          onClick={() => sendCommand('right')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-lg flex items-center justify-center transition"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
        </button>

        {/* Bottom empty cell */}
        <div></div>
        {/* DOWN */}
        <button
          onClick={() => sendCommand('down')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-lg flex items-center justify-center transition"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowDown className="w-6 h-6" />}
        </button>
        {/* Bottom empty cell */}
        <div></div>
      </div>

      {/* Last Command Info */}
      {lastCommand && (
        <div className="p-3 bg-gray-100 rounded text-sm">
          <p className="font-semibold mb-1">Perintah Terakhir:</p>
          <p>Arah: <span className="font-mono">{lastCommand.direction.toUpperCase()}</span></p>
          <p>Status: <span className={`font-semibold ${lastCommand.status === 'success' ? 'text-green-600' : lastCommand.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
            {lastCommand.status}
          </span></p>
          <p className="text-gray-600 text-xs mt-1">
            {new Date(lastCommand.created_at).toLocaleTimeString('id-ID')}
          </p>
        </div>
      )}
    </div>
  );
}