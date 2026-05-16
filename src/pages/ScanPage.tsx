import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Search, X, CheckCircle, Package, MapPin, Hash } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useWarehouseData } from '../hooks/useWarehouseData';
import { inventoryApi, InventoryItem } from '../lib/api';

export function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<InventoryItem | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { refresh } = useWarehouseData();

  const handleScan = useCallback(async (code: string) => {
    try {
      setError(null);
      
      // Try to find by barcode or SKU first
      let item: InventoryItem | null = null;
      
      try {
        item = await inventoryApi.getByBarcode(code);
      } catch {
        // If not found by barcode, search by QR code, SKU or name
        const items = await inventoryApi.list({ search: code, limit: 1 });
        if (items.length > 0) {
          item = items[0];
        }
      }

      if (item) {
        // Mark as scanned via API
        try {
          await inventoryApi.scan(item.id);
        } catch (scanErr) {
          console.warn('Could not update scan timestamp:', scanErr);
        }

        setScanResult(item);
        await refresh();
      } else {
        setError('Barang tidak ditemukan dengan kode ini');
        setScanResult(null);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Gagal memproses scan');
    }
  }, [refresh]);

  const startCamera = async () => {
    try {
      setError(null);
      setCameraReady(true); // Show container first
    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak dapat memulai kamera');
    }
  };

  // Start scanner when container is ready
  useEffect(() => {
    if (!cameraReady || isScanning) return;
    
    const initScanner = async () => {
      try {
        const scannerId = 'qr-scanner-container';
        const element = document.getElementById(scannerId);
        
        if (!element) {
          console.error('Scanner container not found');
          return;
        }
        
        // Create scanner instance
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1 / 1,
            disableFlip: false,
          },
          (decodedText) => {
            console.log('QR Code detected:', decodedText);
            // On successful scan
            handleScan(decodedText);
          },
          (error) => {
            // Ignore QR code detection failures
          }
        );
        
        setIsScanning(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('Permission')) {
          setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('NotFound')) {
          setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
        } else if (errorMessage.includes('NotAllowedError')) {
          setError('Akses kamera tidak diizinkan. Klik ikon kamera di address bar untuk mengizinkan.');
        } else {
          setError(`Tidak dapat mengakses kamera: ${errorMessage}`);
        }
        console.error('Camera error:', err);
        setCameraReady(false);
        setIsScanning(false);
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);
    return () => clearTimeout(timer);
  }, [cameraReady, isScanning, handleScan]);

  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping camera:', err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
      setCameraReady(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pindai Kode QR</h1>
        <p className="text-gray-400">
          Pindai kode QR atau barcode item untuk melihat detail
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Pemindai Kamera
            </h2>
          </div>

          <div className="p-6">
            {/* Camera View */}
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative mb-4">
              {cameraReady ? (
                <div 
                  id="qr-scanner-container" 
                  ref={containerRef}
                  className="w-full h-full"
                  style={{ minHeight: '300px' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500" style={{ minHeight: '300px' }}>
                  <CameraOff className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Kamera Tidak Aktif</p>
                  <p className="text-sm">Klik tombol di bawah untuk mulai scan</p>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {cameraReady ? (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Berhenti
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Mulai Kamera
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Manual Input & Result */}
        <div className="space-y-6">
          {/* Manual Input */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Input Manual
            </h2>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Masukkan kode QR atau barcode..."
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700 bg-green-500/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Item Ditemukan
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Package className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {scanResult.name}
                    </h3>
                    <p className="text-gray-400">
                      {scanResult.category || 'Tanpa Kategori'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Lokasi
                    </p>
                    <p className="text-white font-medium">
                      {typeof scanResult.location === 'object' && scanResult.location?.name
                        ? scanResult.location.name
                        : scanResult.location}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Jumlah
                    </p>
                    <p className="text-white font-medium">{scanResult.quantity}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      scanResult.status === 'TERSEDIA'
                        ? 'bg-green-500/20 text-green-400'
                        : scanResult.status === 'DIPERBARUI'
                        ? 'bg-blue-500/20 text-blue-400'
                        : scanResult.status === 'BERPINDAH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {scanResult.status}
                  </span>
                </div>

                {scanResult.barcode && (
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Barcode</p>
                    <p className="text-white font-mono text-sm">
                      {scanResult.barcode}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setScanResult(null)}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Clear Result
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-white font-medium mb-3">Cara Scan</h3>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                <span>Klik "Mulai Kamera" untuk mengaktifkan scanner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                <span>Posisikan QR code dalam area scanning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                  3
                </span>
                <span>
                  Atau masukkan kode secara manual di kolom input di atas
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
