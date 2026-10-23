import React, { useState } from 'react';
import { User } from '../types.ts';
import { X, Lock, Mail, User as UserIcon, KeyRound, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('TEAM-RAILWAY-2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { username, password }
          : { username, name, email, password, inviteCode };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar la solicitud');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (userType: 'admin' | 'carlos' | 'sofia') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (userType === 'carlos') {
      setUsername('carlos');
      setPassword('dev123');
    } else {
      setUsername('sofia');
      setPassword('dev123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === 'login' ? 'Acceso a CloudStation' : 'Crear Cuenta en el Equipo'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Nube privada & repositorios compartidos para 10 personas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 text-sm font-medium">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'login'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'register'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registrarse (Invitación)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 text-xs text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Código de Invitación del Equipo
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="TEAM-RAILWAY-2026"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Usuario o Correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            {isLoading
              ? 'Procesando...'
              : mode === 'login'
              ? 'Entrar a la Nube'
              : 'Registrar Cuenta'}
          </button>

          {/* Quick preset credentials for frictionless testing */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-2">
              Acceso rápido para prueba inmediata:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1 px-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-center"
              >
                Admin (Tú)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos')}
                className="py-1 px-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-center"
              >
                Carlos Dev
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sofia')}
                className="py-1 px-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-center"
              >
                Sofía Valdés
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
