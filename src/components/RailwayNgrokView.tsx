import React, { useState, useEffect } from 'react';
import { User, InviteCode } from '../types.ts';
import { formatBytes, formatRelativeTime } from '../utils/formatters.ts';
import {
  Server,
  Globe,
  Users,
  Copy,
  Check,
  Plus,
  Shield,
  HardDrive,
  ExternalLink,
  Terminal,
  FileCode,
  Laptop
} from 'lucide-react';

interface RailwayNgrokViewProps {
  currentUser: User | null;
}

export const RailwayNgrokView: React.FC<RailwayNgrokViewProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setMembers(data.members || []);
      setInviteCodes(data.inviteCodes || []);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.invite) {
        setNewInviteCode(data.invite.code);
        fetchTeam();
      }
    } catch (err) {
      console.error('Error creating invite:', err);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const railwayDockerfileContent = `# Compilación y ejecución en Railway
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/src ./src
RUN npm install -g tsx
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["tsx", "server.ts"]`;

  const ngrokBashCommand = `# 1. Instalar ngrok (si no lo tienes)
# En Mac: brew install ngrok
# En Windows: choco install ngrok
# En Linux: curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc

# 2. Conectar tu token de ngrok
ngrok config add-authtoken TU_TOKEN_DE_NGROK

# 3. Exponer el puerto de CloudStation
ngrok http 3000`;

  const railwayCliDeploy = `# Desplegar a Railway en 2 minutos desde la terminal
npm install -g @railway/cli
railway login
railway init
railway up
# En la interfaz de Railway, agrega un Volumen en: /app/data`;

  return (
    <div className="space-y-8">
      {/* View Header with Architecture Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 space-y-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Tu Nube Privada & Plataforma Git para Railway y ngrok
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              CloudStation centraliza tus repositorios de código tipo GitHub, almacenamiento privado en disco y puente directo para transferir fotos desde tu celular a tu computadora a través de ngrok o en la nube de Railway, protegido con acceso privado para 10 miembros.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Laptop className="w-4 h-4 text-blue-400" />
                Terminal CLI Push
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Globe className="w-4 h-4 text-emerald-400" />
                ngrok HTTPS Móvil
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Server className="w-4 h-4 text-purple-400" />
                Railway Docker
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 relative h-48 lg:h-full min-h-[190px] overflow-hidden bg-slate-950">
            <img
              src="/src/assets/images/cloudstation_architecture_1792709232615.jpg"
              alt="Arquitectura CloudStation Nube Privada"
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* 1. Team management (10 members) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Equipo Privado ({members.length} / 10 Miembros)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Esta nube está diseñada para un equipo colaborativo de hasta 10 desarrolladores.
            </p>
          </div>

          <button
            onClick={handleCreateInvite}
            disabled={isCreatingInvite || members.length >= 10}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generar Invitación</span>
          </button>
        </div>

        {/* 10 Seats visualization */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, idx) => {
            const member = members[idx];
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${
                  member
                    ? 'bg-blue-950/30 border-blue-600/40 text-blue-300'
                    : 'bg-[#090d16] border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-mono text-[10px] font-semibold">#{idx + 1}</div>
                <div className="text-[11px] truncate max-w-full font-medium mt-1">
                  {member ? member.username : 'Libre'}
                </div>
              </div>
            );
          })}
        </div>

        {newInviteCode && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-300">
            <span>
              Nuevo código de invitación creado:{' '}
              <strong className="font-mono text-white text-sm">{newInviteCode}</strong>
            </span>
            <button
              onClick={() => copyToClipboard(newInviteCode, 'invite-new')}
              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedKey === 'invite-new' ? 'Copiado' : 'Copiar Código'}
            </button>
          </div>
        )}

        {/* Members Table */}
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-[#090d16]">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3.5 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{m.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{m.username} · {m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-400">
                <span className="font-mono text-[11px] text-slate-400">
                  {m.role === 'admin' ? 'Administrador' : 'Miembro'}
                </span>
                <span className="font-mono tabular-nums text-slate-300">
                  {formatBytes(m.storageUsedBytes || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Railway Deployment Instructions */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Despliegue en Railway (Paso a Paso)
            </h2>
          </div>
          <span className="text-xs font-mono text-purple-400">Listo para producción</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Esta aplicación ya incluye <code className="text-white font-mono">Dockerfile</code> y{' '}
            <code className="text-white font-mono">railway.json</code> configurados para desplegarse automáticamente en Railway.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#090d16] border border-slate-800 rounded-lg space-y-2">
              <div className="font-semibold text-white">1. Subir a Railway</div>
              <p className="text-slate-400">
                Crea un nuevo proyecto en <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">railway.app</a> y selecciona "Deploy from GitHub repo" o usa el CLI.
              </p>
            </div>

            <div className="p-4 bg-[#090d16] border border-slate-800 rounded-lg space-y-2">
              <div className="font-semibold text-white">2. Variables de Entorno</div>
              <p className="text-slate-400">
                Configura en Railway:
                <br />
                <code className="text-purple-300 font-mono">PORT=3000</code>
                <br />
                <code className="text-purple-300 font-mono">NODE_ENV=production</code>
              </p>
            </div>

            <div className="p-4 bg-[#090d16] border border-slate-800 rounded-lg space-y-2">
              <div className="font-semibold text-white">3. Volumen Persistente</div>
              <p className="text-slate-400">
                En la pestaña <em>Volumes</em> de Railway, agrega un disco montado en la ruta{' '}
                <code className="text-amber-300 font-mono">/app/data</code> para que tus archivos y proyectos nunca se borren.
              </p>
            </div>
          </div>

          {/* Quick CLI command */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Comandos para desplegar con Railway CLI:</span>
              <button
                onClick={() => copyToClipboard(railwayCliDeploy, 'railway-cli')}
                className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedKey === 'railway-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'railway-cli' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-purple-300 overflow-x-auto whitespace-pre">
{railwayCliDeploy}
            </pre>
          </div>
        </div>
      </div>

      {/* 3. Custom Domain Setup in Railway */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Cómo Conectar tu Dominio Propio a Railway
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">SSL / HTTPS Automático Gratis</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Puedes usar tanto el dominio gratuito de Railway (<code className="text-purple-300 font-mono">*.up.railway.app</code>) como tu propio dominio comprado en Namecheap, GoDaddy, Cloudflare, DonWeb o Hostinger (ejemplo: <code className="text-blue-400 font-mono">nube.tudominio.com</code>).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090d16] border border-slate-800 rounded-lg space-y-2">
              <span className="font-semibold text-white block">Paso 1: Vincular en Railway</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Ve a tu proyecto en <strong>Railway</strong>.</li>
                <li>Haz clic en tu servicio &rarr; <strong>Settings</strong> &rarr; pestaña <strong>Networking</strong>.</li>
                <li>En la sección <em>Public Networking</em>, haz clic en <strong>Custom Domain</strong>.</li>
                <li>Escribe tu subdominio (ej: <code className="text-blue-300 font-mono">nube.tudominio.com</code>) o dominio raíz.</li>
                <li>Railway te mostrará el valor de destino CNAME (ej: <code className="text-purple-300 font-mono">xxx.up.railway.app</code>).</li>
              </ol>
            </div>

            <div className="p-4 bg-[#090d16] border border-slate-800 rounded-lg space-y-2">
              <span className="font-semibold text-white block">Paso 2: Configurar en tu Proveedor DNS</span>
              <p className="text-slate-400">
                Entra al panel donde compraste tu dominio y agrega un nuevo registro DNS:
              </p>
              <div className="p-2.5 bg-black/60 rounded border border-slate-800 font-mono text-[11px] space-y-1">
                <div><span className="text-slate-500">Tipo:</span> <span className="text-emerald-400">CNAME</span></div>
                <div><span className="text-slate-500">Nombre / Host:</span> <span className="text-blue-400">nube</span> (o subdominio que elijas)</div>
                <div><span className="text-slate-500">Valor / Destino:</span> <span className="text-purple-300">&lt;el destino que te dio Railway&gt;</span></div>
                <div><span className="text-slate-500">TTL:</span> Automático o 300s</div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-slate-300 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Certificado SSL Seguro Automático:</strong>
              Railway gestionará y renovará automáticamente tu certificado SSL/TLS con Let's Encrypt. En 2 a 5 minutos tu nube privada estará activa con candado de seguridad HTTPS en <code className="text-emerald-400 font-mono">https://nube.tudominio.com</code>.
            </div>
          </div>
        </div>
      </div>

      {/* 4. ngrok Setup Guide */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Abrir en tu Computadora con ngrok
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">Túnel Seguro a Internet</span>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            ngrok te permite abrir un túnel HTTPS seguro desde tu computadora hacia internet sin abrir puertos en tu router. Así podrás abrir el enlace en tu celular desde cualquier lugar para subir fotos y acceder a tus repositorios.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Comandos en tu terminal para iniciar ngrok:</span>
              <button
                onClick={() => copyToClipboard(ngrokBashCommand, 'ngrok')}
                className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
              >
                {copiedKey === 'ngrok' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ngrok' ? 'Copiado' : 'Copiar Comandos'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
{ngrokBashCommand}
            </pre>
          </div>

          <div className="p-3.5 bg-blue-950/30 border border-blue-900/60 rounded-lg text-slate-300 flex items-start gap-3">
            <Laptop className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Paso siguiente con tu enlace de ngrok:</strong>
              Una vez que ngrok te dé un enlace como <code className="text-emerald-400 font-mono">https://xxxx.ngrok-free.app</code>, ve a la pestaña <strong>Subir Celular</strong> y pega ese enlace en la caja de dominio para que el código QR apunte directamente a tu celular.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
