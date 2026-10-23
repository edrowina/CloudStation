import React from 'react';
import { CloudFile } from '../types.ts';
import { formatBytes, formatRelativeTime } from '../utils/formatters.ts';
import {
  X,
  Download,
  Star,
  FileText,
  FileCode,
  Smartphone,
  ExternalLink,
  Calendar,
  HardDrive,
  User as UserIcon
} from 'lucide-react';

interface FilePreviewModalProps {
  file: CloudFile | null;
  onClose: () => void;
  onToggleStar: (id: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onToggleStar,
}) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{file.name}</h2>
            {file.isFromMobile && (
              <span className="text-[11px] text-emerald-400 font-mono shrink-0">
                [Subido desde Celular]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleStar(file.id)}
              className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
              title="Favorito"
            >
              <Star
                className={`w-4 h-4 ${
                  file.isStarred ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>

            <a
              href={file.url}
              download={file.name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              title="Descargar archivo a tu computadora"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-[#090d16] p-4 overflow-y-auto flex items-center justify-center min-h-[300px]">
          {file.category === 'image' ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
            />
          ) : file.category === 'code' || file.name.endsWith('.txt') || file.name.endsWith('.md') ? (
            <div className="w-full h-full p-4 font-mono text-xs text-slate-300 bg-[#0f172a] rounded-lg border border-slate-800 overflow-x-auto whitespace-pre">
              {`// Archivo: ${file.name}\n// Tamaño: ${formatBytes(file.size)}\n// Almacenado en: ${file.url}`}
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-16 h-16 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-white">{file.name}</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Vista previa directa no compatible con este formato. Descárgalo para abrirlo en tu computadora.
              </p>
              <a
                href={file.url}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar ({formatBytes(file.size)})</span>
              </a>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono tabular-nums">{formatBytes(file.size)}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono tabular-nums">{formatRelativeTime(file.createdAt)}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{file.uploadedByName}</span>
            </span>

            {file.device && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{file.device}</span>
              </span>
            )}
          </div>

          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:underline"
          >
            <span>Abrir en pestaña nueva</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
