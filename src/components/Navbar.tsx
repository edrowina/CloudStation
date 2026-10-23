import React from 'react';
import { User } from '../types.ts';
import { formatBytes } from '../utils/formatters.ts';
import { LogOut, User as UserIcon, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: 'repos' | 'cloud' | 'mobile' | 'cli' | 'deploy' | 'team';
  setActiveTab: (tab: 'repos' | 'cloud' | 'mobile' | 'cli' | 'deploy' | 'team') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenNewRepo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenNewRepo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('repos')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
        >
          CloudStation
        </button>
        <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
          v2.4
        </span>
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('repos')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'repos'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Repositorios
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'cloud'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Nube Privada
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'mobile'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Subir Celular
        </button>

        <button
          onClick={() => setActiveTab('cli')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'cli'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Terminal CLI
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'deploy'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Railway & ngrok
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
            activeTab === 'team'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Equipo (10)
        </button>
      </nav>

      {/* Zone 3: 1 primary action or user area */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewRepo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">{currentUser.name}</span>
              <span className="font-mono tabular-nums text-slate-300">
                {formatBytes(currentUser.storageUsedBytes || 0)}
              </span>
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>
    </header>
  );
};
