import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CloudFile } from '../types.ts';
import { formatBytes, formatRelativeTime } from '../utils/formatters.ts';
import {
  Smartphone,
  Camera,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  QrCode,
  Laptop,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface MobileDropViewProps {
  onPreviewFile: (file: CloudFile) => void;
}

export const MobileDropView: React.FC<MobileDropViewProps> = ({ onPreviewFile }) => {
  const [mobilePhotos, setMobilePhotos] = useState<CloudFile[]>([]);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deviceModel, setDeviceModel] = useState('Mi Teléfono Celular');

  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  // Initialize domain with window location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomDomain(window.location.origin);
    }
    fetchMobilePhotos();
  }, []);

  const fetchMobilePhotos = async () => {
    try {
      const res = await fetch('/api/files?mobileOnly=true');
      const data = await res.json();
      setMobilePhotos(data.files || []);
    } catch (err) {
      console.error('Error fetching mobile photos:', err);
    }
  };

  const uploadUrl = `${customDomain || (typeof window !== 'undefined' ? window.location.origin : '')}/?tab=mobile`;

  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }
    formData.append('deviceModel', deviceModel);
    formData.append('senderName', deviceModel);

    try {
      const res = await fetch('/api/mobile/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        fetchMobilePhotos();
      }
    } catch (err) {
      console.error('Error uploading mobile photos:', err);
    } finally {
      setIsUploading(false);
      if (fileInputCameraRef.current) fileInputCameraRef.current.value = '';
      if (fileInputGalleryRef.current) fileInputGalleryRef.current.value = '';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Subir Fotos del Celular a la Computadora
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Escanea el código QR con tu teléfono o abre el enlace ngrok para transferir fotos al instante.
        </p>
      </div>

      {/* Grid: QR Code & Connection Guide + Direct Upload Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: QR Code & ngrok domain sync */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Escanear con la Cámara del Móvil</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">Listo para conectar</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#090d16] border border-slate-800 rounded-xl">
              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-lg shrink-0 shadow-lg">
                <QRCodeSVG
                  value={uploadUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* QR info */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 font-medium leading-relaxed">
                  1. Abre la cámara de tu iPhone o Android.
                  <br />
                  2. Apunta a este código QR.
                  <br />
                  3. Selecciona tus fotos o toma fotos en vivo.
                </p>
                <div className="text-[11px] text-slate-400">
                  Las fotos aparecerán en tu computadora en tiempo real.
                </div>
              </div>
            </div>

            {/* Custom domain / ngrok input */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-medium text-slate-300">
                Dominio o URL de Acceso (ngrok o Railway):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="https://tu-subdominio.ngrok-free.app"
                  className="flex-1 px-3 py-2 text-xs bg-[#090d16] border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado' : 'Copiar URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Tip: Si estás ejecutando <code className="text-blue-400 font-mono">ngrok http 3000</code> en tu PC, pega aquí el enlace generado para que el QR dirija a tu celular por internet.
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Mobile Uploader Controller (Phone interface simulation or direct upload) */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Panel de Subida Móvil</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Transferencia Directa PC ↔ Móvil
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre o Modelo del Dispositivo:
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="Ej. iPhone 15 Pro de Juan"
                  className="w-full px-3 py-2 text-xs bg-[#090d16] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Upload buttons: Camera & Gallery */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Take Photo with Camera */}
                <input
                  type="file"
                  ref={fileInputCameraRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleMobileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputCameraRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center p-4 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/60 rounded-xl transition-all cursor-pointer group disabled:opacity-50"
                >
                  <Camera className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Tomar Foto</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Cámara directa</span>
                </button>

                {/* Pick from Gallery */}
                <input
                  type="file"
                  ref={fileInputGalleryRef}
                  accept="image/*"
                  multiple
                  onChange={handleMobileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputGalleryRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-xl transition-all cursor-pointer group disabled:opacity-50"
                >
                  <ImageIcon className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Galería de Fotos</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Múltiples fotos</span>
                </button>
              </div>

              {isUploading && (
                <div className="p-3 bg-blue-950/40 border border-blue-800 text-center text-xs text-blue-300 rounded-lg animate-pulse">
                  Transfiriendo fotos a tu computadora...
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-center text-xs text-emerald-300 rounded-lg flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Fotos subidas y listas en tu computadora!</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>Sincronización instantánea con el disco</span>
            </span>
            <button
              onClick={fetchMobilePhotos}
              className="text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Received Photos Section (Live feed in Computer) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Fotos Recibidas desde el Celular ({mobilePhotos.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Disponibles de inmediato para ver, descargar o guardar en tus proyectos.
            </p>
          </div>

          <button
            onClick={fetchMobilePhotos}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
        </div>

        {mobilePhotos.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Camera className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Aún no hay fotos de móviles</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Escanea el QR superior con tu celular o usa los botones de prueba para transferir tu primera foto a la PC.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mobilePhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onPreviewFile(photo)}
                className="bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer group"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 mb-2 relative">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] text-emerald-400 font-mono">
                    {photo.device || 'Celular'}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-white truncate group-hover:text-blue-400">
                    {photo.name}
                  </h5>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="font-mono tabular-nums">{formatBytes(photo.size)}</span>
                    <a
                      href={photo.url}
                      download={photo.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Descargar a PC"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
