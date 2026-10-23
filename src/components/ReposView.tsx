import React, { useState, useEffect } from 'react';
import { Repository, RepoCommit } from '../types.ts';
import { formatBytes, formatRelativeTime, getLanguageColor } from '../utils/formatters.ts';
import {
  GitBranch,
  Folder,
  FileCode,
  Star,
  Search,
  Plus,
  ArrowLeft,
  Terminal,
  Upload,
  Copy,
  Check,
  Edit3,
  Save,
  Clock,
  Lock,
  Globe,
  Trash2,
  FileText
} from 'lucide-react';

interface ReposViewProps {
  onOpenNewRepoModal: () => void;
  onGoToCli: (repoName?: string) => void;
  userId?: string;
  userName?: string;
}

export const ReposView: React.FC<ReposViewProps> = ({
  onOpenNewRepoModal,
  onGoToCli,
  userId,
}) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'commits' | 'terminal'>('code');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // File explorer state inside a repo
  const [files, setFiles] = useState<Array<{
    path: string;
    name: string;
    type: 'file' | 'folder';
    size: number;
    content?: string;
    updatedAt: string;
  }>>([]);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const fetchRepos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/repos');
      const data = await res.json();
      setRepos(data.repositories || []);
    } catch (err) {
      console.error('Error fetching repos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const loadRepoDetails = async (repo: Repository) => {
    setSelectedRepo(repo);
    setActiveTab('code');
    setActiveFilePath(null);
    setIsEditingFile(false);
    try {
      const res = await fetch(`/api/repos/${repo.id}`);
      const data = await res.json();
      setFiles(data.files || []);
      setCommits(data.commits || []);
      // If README exists, preselect it
      const readme = (data.files || []).find((f: { name: string }) => f.name.toLowerCase() === 'readme.md');
      if (readme) {
        setActiveFilePath(readme.path);
        setCurrentFileContent(readme.content || '');
      } else if (data.files && data.files.length > 0) {
        setActiveFilePath(data.files[0].path);
        setCurrentFileContent(data.files[0].content || '');
      }
    } catch (err) {
      console.error('Error loading repo details:', err);
    }
  };

  const handleSelectFile = async (filePath: string) => {
    setActiveFilePath(filePath);
    setIsEditingFile(false);
    const cached = files.find((f) => f.path === filePath);
    if (cached && cached.content !== undefined) {
      setCurrentFileContent(cached.content);
      return;
    }
    if (selectedRepo) {
      try {
        const res = await fetch(`/api/repos/${selectedRepo.id}/file?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        setCurrentFileContent(data.file?.content || '// Archivo binario o sin contenido');
      } catch (err) {
        console.error('Error loading file content:', err);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!selectedRepo || !activeFilePath) return;
    try {
      const res = await fetch(`/api/repos/${selectedRepo.id}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFilePath,
          content: currentFileContent,
          commitMessage: commitMessage || `update: modificar ${activeFilePath}`,
          userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingFile(false);
        setCommitMessage('');
        // Reload details
        loadRepoDetails(selectedRepo);
      }
    } catch (err) {
      console.error('Error saving file:', err);
    }
  };

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (!confirm(`¿Eliminar definitivamente el repositorio '${repoName}'?`)) return;
    try {
      await fetch(`/api/repos/${repoId}`, { method: 'DELETE' });
      setSelectedRepo(null);
      fetchRepos();
    } catch (err) {
      console.error('Error deleting repo:', err);
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLanguage === 'all' || r.language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  const languages = Array.from(new Set(repos.map((r) => r.language).filter(Boolean)));

  // If viewing a single repository
  if (selectedRepo) {
    return (
      <div className="space-y-6">
        {/* Repo Header */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRepo(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Volver a lista de repositorios"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm font-medium">{selectedRepo.ownerName}</span>
                  <span className="text-slate-600">/</span>
                  <h1 className="text-xl font-bold text-white tracking-tight">{selectedRepo.name}</h1>
                  <span className="text-xs text-slate-400 font-mono ml-2 flex items-center gap-1">
                    {selectedRepo.visibility === 'private' ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Privado</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>Equipo</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedRepo.description || 'Sin descripción'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onGoToCli(selectedRepo.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-950/40 border border-blue-800/60 hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Sincronizar Terminal</span>
              </button>

              <button
                onClick={() => handleDeleteRepo(selectedRepo.id, selectedRepo.name)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Eliminar repositorio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Repo Sub-Navigation */}
          <div className="flex items-center justify-between pt-4 text-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 pb-1 font-medium transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'code'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Archivos & Código ({files.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('commits')}
                className={`flex items-center gap-1.5 pb-1 font-medium transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'commits'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Historial Commits ({commits.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-1.5 pb-1 font-medium transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'terminal'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Push desde Terminal</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-blue-400" />
                <span className="font-mono">{selectedRepo.defaultBranch}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formatBytes(selectedRepo.sizeBytes)}</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Code & File Tree */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left File Tree Sidebar */}
            <div className="lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span>Archivos del Proyecto</span>
                </div>
                <button
                  onClick={() => {
                    const newFileName = prompt('Nombre del nuevo archivo (ej: src/utils.ts):');
                    if (newFileName) {
                      setActiveFilePath(newFileName);
                      setCurrentFileContent('// Nuevo archivo\n');
                      setIsEditingFile(true);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nuevo</span>
                </button>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      activeFilePath === file.path
                        ? 'bg-blue-900/20 text-blue-300 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.name.endsWith('.md') ? (
                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right File Content Viewer & Editor */}
            <div className="lg:col-span-8 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-300 truncate">
                  <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold">{activeFilePath || 'Selecciona un archivo'}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditingFile ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Mensaje de commit..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                      />
                      <button
                        onClick={handleSaveFile}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => setIsEditingFile(false)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    activeFilePath && (
                      <button
                        onClick={() => setIsEditingFile(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Code viewer / editor area */}
              <div className="p-4 flex-1 bg-[#090d16] font-mono text-xs overflow-x-auto min-h-[400px]">
                {isEditingFile ? (
                  <textarea
                    value={currentFileContent}
                    onChange={(e) => setCurrentFileContent(e.target.value)}
                    className="w-full h-full min-h-[380px] bg-transparent text-slate-200 outline-none resize-none font-mono leading-relaxed"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
                    {currentFileContent || '// Selecciona un archivo del explorador'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Commit History */}
        {activeTab === 'commits' && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
            <div className="p-4 bg-slate-900/40 text-xs font-semibold text-slate-300">
              Historial de Versiones & Commits
            </div>
            {commits.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
                <div>
                  <h4 className="text-sm font-medium text-white">{c.message}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{c.author}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatRelativeTime(c.timestamp)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.filesChangedCount} archivo(s)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">
                    {c.id.substring(0, 7)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Terminal & Sincronización */}
        {activeTab === 'terminal' && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Guardar este proyecto desde tu terminal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Usa cualquiera de estos comandos directamente en tu Mac, Linux o Windows para sincronizar este repositorio.
              </p>
            </div>

            {/* Windows PowerShell (Nativo 100%) */}
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400">
                  En Windows PowerShell (Sin instalar nada, sin sudo):
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `$env:CLOUDSTATION_TOKEN = "TU_TOKEN_PAT"\nCompress-Archive -Path .\\* -DestinationPath .\\backup.zip -Force\ncurl.exe -X POST "${window.location.origin}/api/cli/push?repo=${selectedRepo.name}" -H "Authorization: Bearer $env:CLOUDSTATION_TOKEN" -F "file=@.\\backup.zip"\nRemove-Item .\\backup.zip`
                    );
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? '¡Copiado!' : 'Copiar PowerShell'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black/50 rounded text-xs font-mono text-blue-300 overflow-x-auto whitespace-pre">
{`$env:CLOUDSTATION_TOKEN = "TU_TOKEN_PAT"
Compress-Archive -Path .\\* -DestinationPath .\\backup.zip -Force
curl.exe -X POST "${window.location.origin}/api/cli/push?repo=${selectedRepo.name}" -H "Authorization: Bearer $env:CLOUDSTATION_TOKEN" -F "file=@.\\backup.zip"
Remove-Item .\\backup.zip`}
              </pre>
            </div>

            {/* Linux / Mac Bash */}
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400">
                  En Linux / macOS / Git Bash:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `zip -r repo.zip . -x "*.git*" -x "*node_modules*" && curl -X POST "${window.location.origin}/api/cli/push?repo=${selectedRepo.name}" -H "Authorization: Bearer TU_TOKEN_PAT" -F "file=@repo.zip"`
                    );
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Bash</span>
                </button>
              </div>
              <pre className="p-3 bg-black/50 rounded text-xs font-mono text-purple-300 overflow-x-auto whitespace-pre">
{`zip -r repo.zip . -x "*.git*" -x "*node_modules*" && \\
curl -X POST "${window.location.origin}/api/cli/push?repo=${selectedRepo.name}" \\
  -H "Authorization: Bearer TU_TOKEN_PAT" \\
  -F "file=@repo.zip"`}
              </pre>
            </div>

            {/* Link to full CLI page */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
              <span className="text-slate-300">
                ¿Quieres generar tu token PAT o descargar el script <code className="text-blue-400 font-mono">cloud-push.ps1</code> para Windows?
              </span>
              <button
                onClick={() => onGoToCli(selectedRepo.name)}
                className="text-blue-400 hover:underline font-semibold cursor-pointer shrink-0 ml-3"
              >
                Abrir Panel CLI Windows & Mac →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Repo List View
  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Repositorios de Código</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Proyectos privados de tu equipo · Sincronizables desde terminal
          </p>
        </div>

        <button
          onClick={onOpenNewRepoModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Repositorio</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar proyectos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0f172a] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Language selector */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-3 py-2 text-xs bg-[#0f172a] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">Todos los lenguajes</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Repositories Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">Cargando repositorios...</div>
      ) : filteredRepos.length === 0 ? (
        <div className="p-12 text-center bg-[#0f172a] border border-slate-800 rounded-xl space-y-3">
          <GitBranch className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No se encontraron repositorios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Crea tu primer proyecto o sincronízalo directamente desde tu terminal ejecutando un push.
          </p>
          <button
            onClick={onOpenNewRepoModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            Crear Primer Repositorio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => loadRepoDetails(repo)}
              className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {repo.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {repo.visibility === 'private' ? 'Privado' : 'Equipo'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[32px]">
                  {repo.description || 'Sin descripción'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  <span>{repo.language}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums">{formatBytes(repo.sizeBytes)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{formatRelativeTime(repo.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
