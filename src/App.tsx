import React, { useState, useEffect } from 'react';
import { User, CloudFile } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { ReposView } from './components/ReposView.tsx';
import { CloudDriveView } from './components/CloudDriveView.tsx';
import { MobileDropView } from './components/MobileDropView.tsx';
import { TerminalCliView } from './components/TerminalCliView.tsx';
import { RailwayNgrokView } from './components/RailwayNgrokView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { NewRepoModal } from './components/NewRepoModal.tsx';
import { FilePreviewModal } from './components/FilePreviewModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'repos' | 'cloud' | 'mobile' | 'cli' | 'deploy' | 'team'>('repos');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewRepoModalOpen, setIsNewRepoModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);
  const [cliSelectedRepo, setCliSelectedRepo] = useState<string | undefined>(undefined);

  // Check URL query parameters (e.g. ?tab=mobile when scanned with phone)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'mobile') {
        setActiveTab('mobile');
      } else if (tabParam === 'cloud') {
        setActiveTab('cloud');
      } else if (tabParam === 'cli') {
        setActiveTab('cli');
      }

      // Check stored session
      const stored = localStorage.getItem('cloudstation_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // fallback to default admin
        }
      } else {
        // Default to initialized admin for instant zero-friction usability
        const defaultAdmin: User = {
          id: 'usr_admin_001',
          username: 'admin',
          name: 'Administrador (Tú)',
          email: 'equipodinamita316@gmail.com',
          role: 'admin',
          storageUsedBytes: 4850000,
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(defaultAdmin);
        localStorage.setItem('cloudstation_user', JSON.stringify(defaultAdmin));
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cloudstation_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cloudstation_user');
  };

  const handleGoToCli = (repoName?: string) => {
    setCliSelectedRepo(repoName);
    setActiveTab('cli');
  };

  const handleToggleStar = async (id: string) => {
    try {
      await fetch(`/api/files/${id}/star`, { method: 'POST' });
      if (previewFile && previewFile.id === id) {
        setPreviewFile({ ...previewFile, isStarred: !previewFile.isStarred });
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Bar following 3-zone contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewRepo={() => setIsNewRepoModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'repos' && (
          <ReposView
            onOpenNewRepoModal={() => setIsNewRepoModalOpen(true)}
            onGoToCli={handleGoToCli}
            userId={currentUser?.id}
            userName={currentUser?.name}
          />
        )}

        {activeTab === 'cloud' && (
          <CloudDriveView
            onPreviewFile={(file) => setPreviewFile(file)}
            userId={currentUser?.id}
            userName={currentUser?.name}
          />
        )}

        {activeTab === 'mobile' && (
          <MobileDropView onPreviewFile={(file) => setPreviewFile(file)} />
        )}

        {activeTab === 'cli' && (
          <TerminalCliView
            preselectedRepo={cliSelectedRepo}
            userId={currentUser?.id}
          />
        )}

        {(activeTab === 'deploy' || activeTab === 'team') && (
          <RailwayNgrokView currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CloudStation · Nube Privada & Git Repos para Equipos de 10 Personas</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Listo para Railway</span>
            <span aria-hidden="true">·</span>
            <span>Túnel ngrok HTTP</span>
            <span aria-hidden="true">·</span>
            <span>Push desde Terminal</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <NewRepoModal
        isOpen={isNewRepoModalOpen}
        onClose={() => setIsNewRepoModalOpen(false)}
        onRepoCreated={() => {
          setActiveTab('repos');
        }}
        userId={currentUser?.id}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToggleStar={handleToggleStar}
      />
    </div>
  );
}
