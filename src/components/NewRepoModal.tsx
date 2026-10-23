import React, { useState } from 'react';
import { X, GitBranch, FolderGit2, Check } from 'lucide-react';

interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoCreated: () => void;
  userId?: string;
}

export const NewRepoModal: React.FC<NewRepoModalProps> = ({
  isOpen,
  onClose,
  onRepoCreated,
  userId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'team' | 'private'>('team');
  const [template, setTemplate] = useState<'node' | 'python' | 'blank'>('node');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    const languageMap = {
      node: 'TypeScript',
      python: 'Python',
      blank: 'Markdown',
    };

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          visibility,
          template,
          language: languageMap[template],
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error creando repositorio');
      }

      onRepoCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creando repositorio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Crear Nuevo Repositorio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre del Repositorio <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ejemplo-api-servicio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Breve descripción del propósito de este proyecto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Plantilla de Inicio
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTemplate('node')}
                className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                  template === 'node'
                    ? 'bg-blue-950/30 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs">Node / TS</div>
                <div className="text-[11px] text-slate-400 mt-0.5">package.json + Docker</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('python')}
                className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                  template === 'python'
                    ? 'bg-blue-950/30 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs">Python</div>
                <div className="text-[11px] text-slate-400 mt-0.5">main.py + reqs.txt</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('blank')}
                className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                  template === 'blank'
                    ? 'bg-blue-950/30 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs">En Blanco</div>
                <div className="text-[11px] text-slate-400 mt-0.5">README.md inicial</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Visibilidad</label>
            <div className="space-y-2">
              <label
                onClick={() => setVisibility('team')}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  visibility === 'team'
                    ? 'bg-blue-950/30 border-blue-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'team'}
                  onChange={() => setVisibility('team')}
                  className="mt-1"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Equipo (10 personas)</div>
                  <div className="text-[11px] text-slate-400">
                    Visible para todos los miembros con acceso a esta nube privada.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setVisibility('private')}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  visibility === 'private'
                    ? 'bg-blue-950/30 border-blue-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="mt-1"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Privado personal</div>
                  <div className="text-[11px] text-slate-400">
                    Solo tú podrás ver y sincronizar este código.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {isLoading ? 'Creando...' : 'Crear Repositorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
