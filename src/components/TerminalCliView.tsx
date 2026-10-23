import React, { useState, useEffect } from 'react';
import { PersonalAccessToken, Repository } from '../types.ts';
import {
  Terminal,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Download,
  Code2,
  FolderArchive,
  Laptop
} from 'lucide-react';

interface TerminalCliViewProps {
  preselectedRepo?: string;
  userId?: string;
  onRepoUpdated?: () => void;
}

type OsType = 'windows-ps' | 'windows-cmd' | 'windows-gitbash' | 'linux-mac' | 'python';

export const TerminalCliView: React.FC<TerminalCliViewProps> = ({
  preselectedRepo,
  userId,
  onRepoUpdated,
}) => {
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(preselectedRepo || '');
  const [selectedOs, setSelectedOs] = useState<OsType>('windows-ps');
  const [tokenName, setTokenName] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Terminal simulator state
  const [simOutput, setSimOutput] = useState<string[]>([
    'Terminal lista. Selecciona tu sistema operativo (Windows, Mac o Linux) para ver tus comandos exactos.',
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/cli/tokens');
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Error fetching tokens:', err);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos');
      const data = await res.json();
      setRepos(data.repositories || []);
      if (!selectedRepo && data.repositories && data.repositories.length > 0) {
        setSelectedRepo(data.repositories[0].name);
      }
    } catch (err) {
      console.error('Error fetching repos:', err);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchRepos();
  }, []);

  useEffect(() => {
    if (preselectedRepo) {
      setSelectedRepo(preselectedRepo);
    }
  }, [preselectedRepo]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/cli/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName.trim(), userId }),
      });
      const data = await res.json();
      if (data.token) {
        setTokens((prev) => [data.token, ...prev]);
        setTokenName('');
      }
    } catch (err) {
      console.error('Error creating token:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('¿Revocar este token? Los scripts que lo utilicen dejarán de funcionar.')) return;
    try {
      await fetch(`/api/cli/tokens/${id}`, { method: 'DELETE' });
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error deleting token:', err);
    }
  };

  const activeTokenStr = tokens.length > 0 ? tokens[0].token : 'TU_TOKEN_PAT';
  const targetRepoStr = selectedRepo || 'mi-proyecto';

  // Run a simulation call to test push live
  const runSimulation = async () => {
    setIsSimulating(true);
    const repoTarget = targetRepoStr;
    const promptPrefix = selectedOs === 'windows-ps' ? 'PS C:\\MiProyecto>' : selectedOs === 'windows-cmd' ? 'C:\\MiProyecto>' : '$';

    setSimOutput((prev) => [
      ...prev,
      `${promptPrefix} cloud-push ${repoTarget} .`,
      `📦 Empaquetando archivos del directorio actual...`,
      `🚀 Conectando con ${activeOrigin}/api/cli/push...`,
    ]);

    try {
      const testContent = `// Sincronizado desde terminal (${selectedOs}) el ${new Date().toLocaleString()}\nconsole.log("Push exitoso desde CLI");`;
      const blob = new Blob([testContent], { type: 'text/plain' });
      const file = new File([blob], `terminal-sync-${Date.now().toString(36)}.js`, { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', `terminal push (${selectedOs}): ${new Date().toLocaleTimeString()}`);

      const res = await fetch(`/api/cli/push?repo=${encodeURIComponent(repoTarget)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeTokenStr}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSimOutput((prev) => [
          ...prev,
          `✅ 200 OK: ${data.message}`,
          `Commit ID generado: ${data.commitId}`,
          `Repositorio actualizado: ${data.repo}`,
          `---`,
        ]);
        if (onRepoUpdated) onRepoUpdated();
      } else {
        setSimOutput((prev) => [...prev, `❌ Error: ${data.error || 'Fallo de autenticación'}`]);
      }
    } catch (err) {
      setSimOutput((prev) => [...prev, `❌ Error de conexión al servidor: ${err}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Commands per OS
  // 1. Windows PowerShell
  const windowsPsOneLiner = `# En Windows PowerShell (sin instalar nada):
$env:CLOUDSTATION_TOKEN = "${activeTokenStr}"
Compress-Archive -Path .\\* -DestinationPath .\\backup.zip -Force
curl.exe -X POST "${activeOrigin}/api/cli/push?repo=${targetRepoStr}" -H "Authorization: Bearer $env:CLOUDSTATION_TOKEN" -F "file=@.\\backup.zip"
Remove-Item .\\backup.zip`;

  const windowsPsDownloadScript = `# Descargar el script de PowerShell a tu carpeta de proyecto:
Invoke-WebRequest -Uri "${activeOrigin}/api/cli/powershell" -OutFile ".\\cloud-push.ps1"
$env:CLOUDSTATION_TOKEN = "${activeTokenStr}"
.\\cloud-push.ps1 ${targetRepoStr} .`;

  // 2. Windows Command Prompt (CMD)
  const windowsCmdCommand = `rem En el Símbolo del Sistema (CMD) de Windows:
set CLOUDSTATION_TOKEN=${activeTokenStr}
tar.exe -a -c -f backup.zip *
curl.exe -X POST "${activeOrigin}/api/cli/push?repo=${targetRepoStr}" -H "Authorization: Bearer %CLOUDSTATION_TOKEN%" -F "file=@backup.zip"
del backup.zip`;

  // 3. Windows Git Bash
  const windowsGitBashCommand = `# En Git Bash para Windows (sin sudo):
export CLOUDSTATION_TOKEN="${activeTokenStr}"
curl -sSL "${activeOrigin}/api/cli/script" -o ~/cloud-push && chmod +x ~/cloud-push
~/cloud-push ${targetRepoStr} .`;

  // 4. Linux / macOS
  const linuxMacInstallCommand = `sudo curl -fsSL "${activeOrigin}/api/cli/script" -o /usr/local/bin/cloud-push && \\
sudo chmod +x /usr/local/bin/cloud-push && \\
export CLOUDSTATION_TOKEN="${activeTokenStr}" && \\
cloud-push ${targetRepoStr} .`;

  // 5. Python Universal
  const pythonCommand = `# Funciona idéntico en Windows, Mac o Linux (requiere Python 3):
curl -sSL "${activeOrigin}/api/cli/python" -o cloud-push.py
# En Windows:
set CLOUDSTATION_TOKEN=${activeTokenStr}
python cloud-push.py ${targetRepoStr} .`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Terminal CLI · Guardar Proyectos desde tu Computadora
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Compatible con Windows (PowerShell y CMD sin sudo), macOS, Linux y Python.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tokens & Repo Selection */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tokens Section */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Tokens de Acceso Personal (PAT)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {tokens.length} activos
              </span>
            </div>

            {/* Create token form */}
            <form onSubmit={handleCreateToken} className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre (ej. Mi PC Windows)"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-[#090d16] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isGenerating || !tokenName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generar</span>
              </button>
            </form>

            {/* Token list */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {tokens.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No hay tokens creados. Genera uno para tu terminal.
                </div>
              ) : (
                tokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="p-3 bg-[#090d16] border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{tok.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                        {tok.token.substring(0, 10)}...{tok.token.substring(tok.token.length - 4)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tok.token);
                          setCopiedTokenId(tok.id);
                          setTimeout(() => setCopiedTokenId(null), 2000);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copiar token"
                      >
                        {copiedTokenId === tok.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteToken(tok.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Revocar token"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Target Repo Selection */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <label className="block text-xs font-semibold text-white">
              Repositorio de Destino para los Comandos:
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#090d16] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.language})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Si escribes un nombre nuevo que no exista, el servidor lo creará automáticamente en tu primer push.
            </p>
          </div>

          {/* Quick downloads for Windows / Python */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white">Descarga Directa de Scripts</h3>
            <div className="space-y-2">
              <a
                href={`${activeOrigin}/api/cli/powershell`}
                download="cloud-push.ps1"
                className="flex items-center justify-between p-2.5 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">cloud-push.ps1</span>
                </div>
                <span className="text-[11px] text-slate-400">Windows PowerShell</span>
              </a>

              <a
                href={`${activeOrigin}/api/cli/python`}
                download="cloud-push.py"
                className="flex items-center justify-between p-2.5 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span className="font-semibold text-white">cloud-push.py</span>
                </div>
                <span className="text-[11px] text-slate-400">Python Multiplataforma</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: OS Tabs & Instructions */}
        <div className="lg:col-span-7 space-y-4">
          {/* OS Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#0f172a] border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedOs('windows-ps')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedOs === 'windows-ps'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows (PowerShell)
            </button>

            <button
              onClick={() => setSelectedOs('windows-cmd')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedOs === 'windows-cmd'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows (CMD)
            </button>

            <button
              onClick={() => setSelectedOs('windows-gitbash')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedOs === 'windows-gitbash'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows (Git Bash)
            </button>

            <button
              onClick={() => setSelectedOs('linux-mac')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedOs === 'linux-mac'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Linux / macOS
            </button>

            <button
              onClick={() => setSelectedOs('python')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedOs === 'python'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
          </div>

          {/* OS-Specific Instruction Card */}
          {selectedOs === 'windows-ps' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Subir desde Windows PowerShell (Nativo 100%, Sin sudo)
                  </h3>
                </div>
                <span className="text-xs font-mono text-blue-400">Windows 10 / 11</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                En Windows no necesitas <code className="text-red-400 font-mono">sudo</code>. Abre tu <strong>PowerShell</strong> (puedes buscarlo en el menú Inicio de Windows), entra a la carpeta de tu proyecto y copia y pega estos comandos:
              </p>

              {/* Command box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Opción A: Comando directo de PowerShell
                  </span>
                  <button
                    onClick={() => copyToClipboard(windowsPsOneLiner, 'win-ps')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'win-ps' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'win-ps' ? 'Copiado' : 'Copiar comandos'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto whitespace-pre">
{windowsPsOneLiner}
                </pre>
              </div>

              {/* Script option */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Opción B: Descargar y usar el script 'cloud-push.ps1'
                  </span>
                  <button
                    onClick={() => copyToClipboard(windowsPsDownloadScript, 'win-ps-script')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'win-ps-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'win-ps-script' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
{windowsPsDownloadScript}
                </pre>
              </div>
            </div>
          )}

          {selectedOs === 'windows-cmd' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Subir desde el Símbolo del Sistema (CMD)
                  </h3>
                </div>
                <span className="text-xs font-mono text-amber-400">cmd.exe</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tanto <code className="text-white font-mono">tar.exe</code> como <code className="text-white font-mono">curl.exe</code> vienen preinstalados en Windows 10 y Windows 11. Ejecuta esto dentro de la carpeta de tu proyecto:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Comandos CMD:</span>
                  <button
                    onClick={() => copyToClipboard(windowsCmdCommand, 'win-cmd')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'win-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'win-cmd' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto whitespace-pre">
{windowsCmdCommand}
                </pre>
              </div>
            </div>
          )}

          {selectedOs === 'windows-gitbash' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Subir desde Git Bash en Windows (Sin sudo)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400">Git Bash / MinGW</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Si tienes instalado Git en Windows, puedes usar Git Bash guardando el ejecutable en tu carpeta de usuario <code className="text-emerald-400 font-mono">~/cloud-push</code>:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Comandos Git Bash:</span>
                  <button
                    onClick={() => copyToClipboard(windowsGitBashCommand, 'git-bash')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'git-bash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'git-bash' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
{windowsGitBashCommand}
                </pre>
              </div>
            </div>
          )}

          {selectedOs === 'linux-mac' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Subir desde macOS o Linux
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-400">Bash / Zsh</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Instalar script global:</span>
                  <button
                    onClick={() => copyToClipboard(linuxMacInstallCommand, 'linux-mac')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'linux-mac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'linux-mac' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-purple-300 overflow-x-auto whitespace-pre">
{linuxMacInstallCommand}
                </pre>
              </div>
            </div>
          )}

          {selectedOs === 'python' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-bold text-white">
                    Subir con Python (Universal sin dependencias)
                  </h3>
                </div>
                <span className="text-xs font-mono text-yellow-400">Python 3.x</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Utiliza las librerías nativas de Python (<code className="text-white font-mono">urllib</code> y <code className="text-white font-mono">zipfile</code>) para empaquetar y subir sin importar qué sistema operativo uses:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Comandos Python:</span>
                  <button
                    onClick={() => copyToClipboard(pythonCommand, 'python-cmd')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCodeId === 'python-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeId === 'python-cmd' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-yellow-300 overflow-x-auto whitespace-pre">
{pythonCommand}
                </pre>
              </div>
            </div>
          )}

          {/* Interactive In-Browser Terminal Simulator */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Simulador de Terminal en Vivo ({selectedOs.toUpperCase()})</span>
              </div>
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isSimulating ? 'Sincronizando...' : 'Ejecutar Prueba de Push'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-black rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1">
              {simOutput.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line.startsWith('$') || line.startsWith('PS ') || line.startsWith('C:\\') ? (
                    <span className="text-emerald-400 font-semibold">{line}</span>
                  ) : line.startsWith('✅') ? (
                    <span className="text-emerald-300">{line}</span>
                  ) : line.startsWith('❌') ? (
                    <span className="text-red-400">{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
