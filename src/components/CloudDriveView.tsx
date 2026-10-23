import React, { useState, useEffect, useRef } from 'react';
import { CloudFile, CloudFolder } from '../types.ts';
import { formatBytes, formatRelativeTime } from '../utils/formatters.ts';
import {
  Folder,
  File,
  Image as ImageIcon,
  FileText,
  FileCode,
  Archive,
  Upload,
  Star,
  Trash2,
  Download,
  Smartphone,
  Eye,
  Grid,
  List,
  Search,
  Plus
} from 'lucide-react';

interface CloudDriveViewProps {
  onPreviewFile: (file: CloudFile) => void;
  userId?: string;
  userName?: string;
}

export const CloudDriveView: React.FC<CloudDriveViewProps> = ({
  onPreviewFile,
  userId,
  userName,
}) => {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    formData.append('userId', userId || '');
    formData.append('userName', userName || '');

    try {
      setUploadProgress(50);
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
        fetchFiles();
      }, 500);
    } catch (err) {
      console.error('Error uploading files:', err);
      setIsUploading(false);
      setUploadProgress(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/files/${id}/star`, { method: 'POST' });
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isStarred: !f.isStarred } : f))
      );
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleDeleteFile = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar '${name}' de tu nube privada?`)) return;
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (category === 'all') return true;
    if (category === 'starred') return f.isStarred;
    if (category === 'mobile') return f.isFromMobile;
    return f.category === category;
  });

  const getCategoryIcon = (cat: string, isFromMobile?: boolean) => {
    if (isFromMobile) return <Smartphone className="w-4 h-4 text-emerald-400" />;
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-purple-400" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-orange-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nube Privada & Archivos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Almacenamiento seguro compartido · Subidas desde PC y celular
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Subiendo...' : 'Subir Archivos'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when uploading */}
      {uploadProgress !== null && (
        <div className="bg-[#0f172a] border border-blue-900/60 rounded-lg p-3">
          <div className="flex justify-between text-xs text-blue-300 mb-1">
            <span>Subiendo archivo a tu nube privada...</span>
            <span className="font-mono tabular-nums">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Filter Bar (Interactive Segmented buttons, permitted by constitution) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0f172a] border border-slate-800 rounded-lg text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'mobile', label: 'Fotos Celular' },
            { id: 'image', label: 'Imágenes' },
            { id: 'document', label: 'Documentos' },
            { id: 'code', label: 'Código' },
            { id: 'archive', label: 'ZIP & Paquetes' },
            { id: 'starred', label: 'Favoritos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                category === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#0f172a] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-[#0f172a] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de cuadrícula"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center bg-[#0f172a] border border-slate-800 rounded-xl space-y-3">
          <Folder className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No hay archivos en esta categoría</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sube documentos, fotos desde tu teléfono, o sincroniza archivos de proyectos.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            Subir Primer Archivo
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => onPreviewFile(file)}
              className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer group relative"
            >
              {/* Star button */}
              <button
                onClick={(e) => handleToggleStar(file.id, e)}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-amber-400 transition-colors z-10"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    file.isStarred ? 'fill-amber-400 text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Thumbnail / Icon area */}
              <div className="w-full aspect-square bg-[#090d16] rounded-lg overflow-hidden flex items-center justify-center mb-2.5 relative">
                {file.category === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback gracefully
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="p-4 text-center">
                    {getCategoryIcon(file.category, file.isFromMobile)}
                  </div>
                )}

                {file.isFromMobile && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <Smartphone className="w-2.5 h-2.5" />
                    <span>Móvil</span>
                  </span>
                )}
              </div>

              {/* Title & metadata */}
              <div>
                <h4 className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {file.name}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span className="font-mono tabular-nums">{formatBytes(file.size)}</span>
                  <span className="font-mono tabular-nums">{formatRelativeTime(file.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
          <div className="px-4 py-2.5 bg-slate-900/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Nombre</span>
            <div className="flex items-center gap-12 pr-12">
              <span className="hidden sm:inline">Subido por</span>
              <span>Tamaño</span>
              <span>Fecha</span>
            </div>
          </div>

          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => onPreviewFile(file)}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors cursor-pointer group text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getCategoryIcon(file.category, file.isFromMobile)}
                <span className="font-medium text-white group-hover:text-blue-400 truncate">
                  {file.name}
                </span>
                {file.isFromMobile && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    [Móvil]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-8 shrink-0 text-slate-400">
                <span className="hidden sm:inline text-slate-400 truncate max-w-[120px]">
                  {file.uploadedByName}
                </span>
                <span className="font-mono tabular-nums w-16 text-right">
                  {formatBytes(file.size)}
                </span>
                <span className="font-mono tabular-nums w-24 text-right">
                  {formatRelativeTime(file.createdAt)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleToggleStar(file.id, e)}
                    className="p-1 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        file.isStarred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:text-white transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => handleDeleteFile(file.id, file.name, e)}
                    className="p-1 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
