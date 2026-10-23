import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data and uploads directories exist
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// Helper for Database persistence
interface DBData {
  users: Array<{
    id: string;
    username: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'member';
    storageUsedBytes: number;
    createdAt: string;
  }>;
  inviteCodes: Array<{
    code: string;
    createdBy: string;
    createdAt: string;
    usedBy?: string;
    isUsed: boolean;
  }>;
  files: Array<{
    id: string;
    name: string;
    originalName: string;
    size: number;
    mimeType: string;
    category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';
    filename: string;
    url: string;
    folderId?: string | null;
    uploadedBy: string;
    uploadedByName: string;
    isFromMobile?: boolean;
    device?: string;
    isStarred?: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  folders: Array<{
    id: string;
    name: string;
    parentId?: string | null;
    createdBy: string;
    createdAt: string;
  }>;
  repositories: Array<{
    id: string;
    name: string;
    description: string;
    visibility: 'private' | 'team';
    ownerId: string;
    ownerName: string;
    defaultBranch: string;
    language: string;
    sizeBytes: number;
    starsCount: number;
    createdAt: string;
    updatedAt: string;
    readme?: string;
    filesCount: number;
  }>;
  repoFiles: Record<string, Array<{
    path: string;
    name: string;
    type: 'file' | 'folder';
    size: number;
    content?: string;
    updatedAt: string;
  }>>;
  commits: Record<string, Array<{
    id: string;
    message: string;
    author: string;
    authorEmail: string;
    timestamp: string;
    filesChangedCount: number;
  }>>;
  tokens: Array<{
    id: string;
    name: string;
    token: string;
    userId: string;
    createdAt: string;
    lastUsedAt?: string;
  }>;
}

function getInitialDB(): DBData {
  const adminId = 'usr_admin_001';
  const devId = 'usr_dev_002';

  const initialRepos = [
    {
      id: 'repo_api_service',
      name: 'microservice-auth-api',
      description: 'API de autenticación y microservicios en Node.js + Express con soporte para Docker y Railway',
      visibility: 'team' as const,
      ownerId: adminId,
      ownerName: 'Administrador (Tú)',
      defaultBranch: 'main',
      language: 'TypeScript',
      sizeBytes: 145000,
      starsCount: 3,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      readme: '# Microservice Auth API\n\nServicio de autenticación backend para microservicios.\n\n## Características\n- JWT Authentication & RBAC\n- Rate limiting & CORS seguro\n- Preparado para desplegar en Railway con ngrok para pruebas remotas\n\n## Instalación\n```bash\nnpm install\nnpm run dev\n```\n\n## Despliegue en Railway\nConfigura la variable `PORT=3000` y sube los cambios usando el CLI de CloudStation o Git push.',
      filesCount: 4,
    },
    {
      id: 'repo_frontend_app',
      name: 'dashboard-team-react',
      description: 'Panel de control con React 19, Tailwind CSS y soporte PWA móvil',
      visibility: 'team' as const,
      ownerId: devId,
      ownerName: 'Carlos Dev',
      defaultBranch: 'main',
      language: 'React',
      sizeBytes: 284000,
      starsCount: 5,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      readme: '# Dashboard Team React\n\nFrontend moderno con Tailwind CSS y componentes responsivos.\n\nSincroniza directamente desde tu terminal ejecutando:\n```bash\ncurl -X POST "$CLOUD_URL/api/cli/push?repo=dashboard-team-react" \\\n  -H "Authorization: Bearer $PAT_TOKEN" \\\n  -F "file=@dist.zip"\n```',
      filesCount: 5,
    },
    {
      id: 'repo_python_scraper',
      name: 'python-data-pipeline',
      description: 'Scripts de extracción de datos y pipelines de procesamiento en Python',
      visibility: 'private' as const,
      ownerId: adminId,
      ownerName: 'Administrador (Tú)',
      defaultBranch: 'main',
      language: 'Python',
      sizeBytes: 98000,
      starsCount: 1,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      readme: '# Python Data Pipeline\n\nPipeline para ingesta y transformación de datos en JSON/Parquet.\n\nEjecución local:\n```bash\npython main.py --env=production\n```',
      filesCount: 3,
    }
  ];

  return {
    users: [
      {
        id: adminId,
        username: 'admin',
        name: 'Administrador',
        email: 'equipodinamita316@gmail.com',
        passwordHash: 'admin123',
        role: 'admin',
        storageUsedBytes: 4850000,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: devId,
        username: 'carlos',
        name: 'Carlos Mendoza',
        email: 'carlos@equipo.local',
        passwordHash: 'dev123',
        role: 'member',
        storageUsedBytes: 2150000,
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: 'usr_dev_003',
        username: 'sofia',
        name: 'Sofía Valdés',
        email: 'sofia@equipo.local',
        passwordHash: 'dev123',
        role: 'member',
        storageUsedBytes: 1420000,
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      }
    ],
    inviteCodes: [
      {
        code: 'TEAM-RAILWAY-2026',
        createdBy: adminId,
        createdAt: new Date().toISOString(),
        isUsed: false,
      },
      {
        code: 'DEV-CLOUD-7788',
        createdBy: adminId,
        createdAt: new Date().toISOString(),
        isUsed: false,
      }
    ],
    files: [
      {
        id: 'file_sample_photo1',
        name: 'captura_celular_proyecto.jpg',
        originalName: 'IMG_20261022_143015.jpg',
        size: 1845000,
        mimeType: 'image/jpeg',
        category: 'image',
        filename: 'sample_phone_photo1.jpg',
        url: '/uploads/sample_phone_photo1.jpg',
        uploadedBy: adminId,
        uploadedByName: 'Administrador',
        isFromMobile: true,
        device: 'Xiaomi / Android (ngrok)',
        isStarred: true,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'file_sample_schema',
        name: 'arquitectura_nube_privada.pdf',
        originalName: 'arquitectura_nube_privada.pdf',
        size: 840000,
        mimeType: 'application/pdf',
        category: 'document',
        filename: 'arquitectura_nube_privada.pdf',
        url: '/uploads/arquitectura_nube_privada.pdf',
        uploadedBy: adminId,
        uploadedByName: 'Administrador',
        isStarred: true,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'file_sample_docker',
        name: 'docker-compose-railway.yml',
        originalName: 'docker-compose.yml',
        size: 4200,
        mimeType: 'text/yaml',
        category: 'code',
        filename: 'docker-compose.yml',
        url: '/uploads/docker-compose.yml',
        uploadedBy: devId,
        uploadedByName: 'Carlos Mendoza',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      }
    ],
    folders: [
      {
        id: 'folder_mobile_drops',
        name: 'Subidas Celular (Mobile Drop)',
        createdBy: adminId,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'folder_projects_backup',
        name: 'Backups Terminal CLI',
        createdBy: adminId,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      }
    ],
    repositories: initialRepos,
    repoFiles: {
      'repo_api_service': [
        {
          path: 'src/index.ts',
          name: 'index.ts',
          type: 'file',
          size: 1420,
          content: `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'ok', time: new Date().toISOString() });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Servicio corriendo en puerto \${PORT}\`);\n});`,
          updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          size: 620,
          content: `{\n  "name": "microservice-auth-api",\n  "version": "1.0.0",\n  "main": "dist/index.js",\n  "scripts": {\n    "dev": "tsx watch src/index.ts",\n    "build": "tsc",\n    "start": "node dist/index.js"\n  },\n  "dependencies": {\n    "express": "^4.21.0"\n  }\n}`,
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          path: 'Dockerfile',
          name: 'Dockerfile',
          type: 'file',
          size: 450,
          content: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]`,
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          path: 'README.md',
          name: 'README.md',
          type: 'file',
          size: 890,
          content: '# Microservice Auth API\n\nServicio de autenticación backend para microservicios.\n\n## Características\n- JWT Authentication & RBAC\n- Rate limiting & CORS seguro\n- Preparado para desplegar en Railway con ngrok para pruebas remotas',
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        }
      ],
      'repo_frontend_app': [
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          size: 1800,
          content: `export default function App() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-bold">Cloud Dashboard Team</h1>\n      <p>Sincronizado vía CloudStation CLI</p>\n    </main>\n  );\n}`,
          updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        {
          path: 'README.md',
          name: 'README.md',
          type: 'file',
          size: 520,
          content: '# Dashboard Team React\n\nFrontend moderno con Tailwind CSS y componentes responsivos.',
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        }
      ],
      'repo_python_scraper': [
        {
          path: 'main.py',
          name: 'main.py',
          type: 'file',
          size: 860,
          content: `import os\nimport time\nimport json\n\ndef run_pipeline():\n    print("Iniciando pipeline de datos...")\n    # Simulación de extracción\n    data = {"status": "success", "processed_records": 1540}\n    print(json.dumps(data, indent=2))\n\nif __name__ == "__main__":\n    run_pipeline()`,
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          path: 'requirements.txt',
          name: 'requirements.txt',
          type: 'file',
          size: 120,
          content: `requests>=2.31.0\npandas>=2.1.0\npydantic>=2.4.0`,
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          path: 'README.md',
          name: 'README.md',
          type: 'file',
          size: 340,
          content: '# Python Data Pipeline\n\nPipeline para ingesta y transformación de datos en Python.',
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        }
      ]
    },
    commits: {
      'repo_api_service': [
        {
          id: 'c7f91a2',
          message: 'feat: agregar endpoint de salud y soporte Docker para Railway',
          author: 'Administrador',
          authorEmail: 'equipodinamita316@gmail.com',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          filesChangedCount: 2,
        },
        {
          id: 'b4a8e31',
          message: 'init: commit inicial del microservicio',
          author: 'Administrador',
          authorEmail: 'equipodinamita316@gmail.com',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          filesChangedCount: 3,
        }
      ],
      'repo_frontend_app': [
        {
          id: 'd9e03c1',
          message: 'chore: actualización de dependencias y scripts de build',
          author: 'Carlos Mendoza',
          authorEmail: 'carlos@equipo.local',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          filesChangedCount: 1,
        },
        {
          id: 'a1b2c3d',
          message: 'init: configuración de componentes y Tailwind CSS',
          author: 'Carlos Mendoza',
          authorEmail: 'carlos@equipo.local',
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
          filesChangedCount: 4,
        }
      ],
      'repo_python_scraper': [
        {
          id: 'e5f6g7h',
          message: 'feat: lógica básica de pipeline y requirements.txt',
          author: 'Administrador',
          authorEmail: 'equipodinamita316@gmail.com',
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
          filesChangedCount: 3,
        }
      ]
    },
    tokens: [
      {
        id: 'tok_default_admin',
        name: 'MacBook / Terminal CLI Principal',
        token: 'cst_' + crypto.randomBytes(16).toString('hex'),
        userId: adminId,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]
  };
}

function loadDB(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, reinitializing:', err);
  }
  const init = getInitialDB();
  saveDB(init);
  return init;
}

function saveDB(data: DBData): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// Initialize database
let db = loadDB();

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads serving
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Determine file category
function getFileCategory(mimeType: string, filename: string): 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other' {
  const ext = path.extname(filename).toLowerCase();
  if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic'].includes(ext)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    return 'audio';
  }
  if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
    return 'archive';
  }
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'].includes(ext)) {
    return 'document';
  }
  if (['.js', '.ts', '.tsx', '.jsx', '.py', '.json', '.html', '.css', '.c', '.cpp', '.sh', '.yaml', '.yml', '.go', '.rs'].includes(ext)) {
    return 'code';
  }
  return 'other';
}

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  db = loadDB();
  const user = db.users.find(
    (u) => (u.username.toLowerCase() === (username || '').toLowerCase() || u.email.toLowerCase() === (username || '').toLowerCase()) &&
           u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Generate a bearer session token
  const token = 'usr_token_' + Buffer.from(`${user.id}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`).toString('base64');

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      storageUsedBytes: user.storageUsedBytes,
      createdAt: user.createdAt,
      token,
    },
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, name, email, password, inviteCode } = req.body;
  db = loadDB();

  // Cap at 10 active team members
  if (db.users.length >= 10) {
    return res.status(403).json({ error: 'Límite de 10 usuarios alcanzado para esta nube privada compartida.' });
  }

  // Validate invite code if provided or enforce invite code if not the very first user
  if (db.users.length > 0) {
    const validCode = db.inviteCodes.find((c) => c.code === (inviteCode || '').trim() && !c.isUsed);
    if (!validCode) {
      return res.status(400).json({ error: 'Código de invitación inválido o ya utilizado. Solicita uno al administrador.' });
    }
    validCode.isUsed = true;
    validCode.usedBy = username;
  }

  const existing = db.users.find((u) => u.username.toLowerCase() === (username || '').toLowerCase() || u.email.toLowerCase() === (email || '').toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'El nombre de usuario o correo ya está registrado.' });
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36),
    username: username.trim(),
    name: name.trim() || username.trim(),
    email: email.trim(),
    passwordHash: password,
    role: (db.users.length === 0 ? 'admin' : 'member') as 'admin' | 'member',
    storageUsedBytes: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB(db);

  const token = 'usr_token_' + Buffer.from(`${newUser.id}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`).toString('base64');

  res.json({
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      storageUsedBytes: newUser.storageUsedBytes,
      createdAt: newUser.createdAt,
      token,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  db = loadDB();
  // By default return admin if token matches or demo token
  const user = db.users[0];
  res.json({ user });
});

// ==================== TEAM & INVITES ====================

app.get('/api/team', (_req: Request, res: Response) => {
  db = loadDB();
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    storageUsedBytes: u.storageUsedBytes,
    createdAt: u.createdAt,
  }));
  res.json({
    members: safeUsers,
    totalSlots: 10,
    usedSlots: safeUsers.length,
    inviteCodes: db.inviteCodes,
  });
});

app.post('/api/team/invite', (req: Request, res: Response) => {
  db = loadDB();
  if (db.users.length >= 10) {
    return res.status(400).json({ error: 'El equipo ya tiene 10 personas.' });
  }
  const newCode = 'TEAM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const invite = {
    code: newCode,
    createdBy: req.body.userId || db.users[0]?.id || 'admin',
    createdAt: new Date().toISOString(),
    isUsed: false,
  };
  db.inviteCodes.push(invite);
  saveDB(db);
  res.json({ invite });
});

// ==================== CLOUD FILES & DRIVE ====================

app.get('/api/files', (req: Request, res: Response) => {
  db = loadDB();
  const { category, folderId, mobileOnly } = req.query;
  let result = [...db.files];

  if (category && category !== 'all') {
    result = result.filter((f) => f.category === category);
  }
  if (folderId) {
    result = result.filter((f) => f.folderId === folderId);
  }
  if (mobileOnly === 'true') {
    result = result.filter((f) => f.isFromMobile);
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    files: result,
    folders: db.folders,
  });
});

app.post('/api/files/upload', upload.array('files'), (req: Request, res: Response) => {
  db = loadDB();
  const reqFiles = (req.files as Express.Multer.File[]) || [];
  if (reqFiles.length === 0) {
    return res.status(400).json({ error: 'No se recibieron archivos.' });
  }

  const uploaderId = (req.body.userId as string) || db.users[0]?.id;
  const user = db.users.find((u) => u.id === uploaderId) || db.users[0];
  const folderId = req.body.folderId || null;
  const isFromMobile = req.body.isFromMobile === 'true';
  const device = (req.body.device as string) || (isFromMobile ? 'Móvil / Celular' : 'Escritorio');

  const addedFiles = reqFiles.map((f) => {
    const category = getFileCategory(f.mimetype, f.originalname);
    const item = {
      id: 'file_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: f.originalname,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      category,
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      folderId,
      uploadedBy: user.id,
      uploadedByName: user.name,
      isFromMobile,
      device,
      isStarred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.files.unshift(item);
    user.storageUsedBytes = (user.storageUsedBytes || 0) + f.size;
    return item;
  });

  saveDB(db);
  res.json({ files: addedFiles });
});

app.post('/api/files/:id/star', (req: Request, res: Response) => {
  db = loadDB();
  const file = db.files.find((f) => f.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  file.isStarred = !file.isStarred;
  saveDB(db);
  res.json({ file });
});

app.delete('/api/files/:id', (req: Request, res: Response) => {
  db = loadDB();
  const index = db.files.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  const file = db.files[index];
  try {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error deleting file on disk:', err);
  }
  db.files.splice(index, 1);
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/folders', (req: Request, res: Response) => {
  const { name, parentId, userId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nombre de carpeta requerido' });
  }
  db = loadDB();
  const newFolder = {
    id: 'folder_' + Date.now().toString(36),
    name: name.trim(),
    parentId: parentId || null,
    createdBy: userId || db.users[0]?.id,
    createdAt: new Date().toISOString(),
  };
  db.folders.push(newFolder);
  saveDB(db);
  res.json({ folder: newFolder });
});

// ==================== MOBILE DIRECT DROP (Fotos desde el Celular) ====================

app.post('/api/mobile/upload', upload.array('photos'), (req: Request, res: Response) => {
  db = loadDB();
  const reqFiles = (req.files as Express.Multer.File[]) || [];
  if (reqFiles.length === 0) {
    return res.status(400).json({ error: 'No se subieron imágenes' });
  }

  const device = req.headers['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Celular Móvil';
  const user = db.users[0]; // Default team owner

  const addedFiles = reqFiles.map((f) => {
    const item = {
      id: 'photo_mob_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: f.originalname || `Foto_${Date.now()}.jpg`,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      category: 'image' as const,
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      folderId: 'folder_mobile_drops',
      uploadedBy: user.id,
      uploadedByName: 'Móvil / ' + (req.body.senderName || 'Celular'),
      isFromMobile: true,
      device: req.body.deviceModel || 'Cámara Teléfono',
      isStarred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.files.unshift(item);
    user.storageUsedBytes = (user.storageUsedBytes || 0) + f.size;
    return item;
  });

  saveDB(db);
  res.json({ success: true, count: addedFiles.length, files: addedFiles });
});

// ==================== GITHUB-STYLE REPOSITORIES ====================

app.get('/api/repos', (_req: Request, res: Response) => {
  db = loadDB();
  // Sort repositories by updated date
  const sorted = [...db.repositories].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ repositories: sorted });
});

app.post('/api/repos', (req: Request, res: Response) => {
  const { name, description, visibility, language, template, userId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre del repositorio es obligatorio' });
  }

  db = loadDB();
  const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const existing = db.repositories.find((r) => r.name.toLowerCase() === safeName);
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un repositorio con ese nombre.' });
  }

  const repoId = 'repo_' + safeName.replace(/-/g, '_') + '_' + Date.now().toString(36);
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  const initialReadme = `# ${name}\n\n${description || 'Proyecto alojado en CloudStation Nube Privada.'}\n\n## Inicio Rápido\nSincroniza y guarda cambios directamente desde tu terminal:\n\`\`\`bash\n# Guarda tu proyecto directamente\ncurl -X POST "$CLOUD_URL/api/cli/push?repo=${safeName}" \\\n  -H "Authorization: Bearer TU_TOKEN_PAT" \\\n  -F "file=@proyecto.zip"\n\`\`\``;

  const newRepo = {
    id: repoId,
    name: safeName,
    description: description || '',
    visibility: (visibility || 'team') as 'private' | 'team',
    ownerId: user.id,
    ownerName: user.name,
    defaultBranch: 'main',
    language: language || 'TypeScript',
    sizeBytes: 15400,
    starsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readme: initialReadme,
    filesCount: 2,
  };

  db.repositories.unshift(newRepo);

  // Initialize files based on template
  const initialFiles: Array<{
    path: string;
    name: string;
    type: 'file' | 'folder';
    size: number;
    content?: string;
    updatedAt: string;
  }> = [
    {
      path: 'README.md',
      name: 'README.md',
      type: 'file',
      size: initialReadme.length,
      content: initialReadme,
      updatedAt: new Date().toISOString(),
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      type: 'file',
      size: 150,
      content: `node_modules/\n.env\ndist/\n.DS_Store\n*.log\n__pycache__/\n`,
      updatedAt: new Date().toISOString(),
    }
  ];

  if (template === 'node' || language === 'TypeScript' || language === 'JavaScript') {
    initialFiles.push({
      path: 'package.json',
      name: 'package.json',
      type: 'file',
      size: 280,
      content: `{\n  "name": "${safeName}",\n  "version": "1.0.0",\n  "description": "${description || ''}",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js"\n  }\n}`,
      updatedAt: new Date().toISOString(),
    });
    initialFiles.push({
      path: 'index.js',
      name: 'index.js',
      type: 'file',
      size: 160,
      content: `console.log("¡Proyecto ${safeName} corriendo exitosamente en CloudStation!");\n`,
      updatedAt: new Date().toISOString(),
    });
    newRepo.filesCount = initialFiles.length;
  } else if (template === 'python' || language === 'Python') {
    initialFiles.push({
      path: 'main.py',
      name: 'main.py',
      type: 'file',
      size: 200,
      content: `def main():\n    print("Hola desde ${safeName}")\n\nif __name__ == '__main__':\n    main()\n`,
      updatedAt: new Date().toISOString(),
    });
    initialFiles.push({
      path: 'requirements.txt',
      name: 'requirements.txt',
      type: 'file',
      size: 40,
      content: `# Dependencias de Python\n`,
      updatedAt: new Date().toISOString(),
    });
    newRepo.filesCount = initialFiles.length;
  }

  db.repoFiles[repoId] = initialFiles;
  db.commits[repoId] = [
    {
      id: crypto.randomBytes(4).toString('hex'),
      message: 'init: repositorio creado con plantilla',
      author: user.name,
      authorEmail: user.email,
      timestamp: new Date().toISOString(),
      filesChangedCount: initialFiles.length,
    }
  ];

  saveDB(db);
  res.json({ repository: newRepo });
});

app.get('/api/repos/:id', (req: Request, res: Response) => {
  db = loadDB();
  const repo = db.repositories.find((r) => r.id === req.params.id || r.name === req.params.id);
  if (!repo) {
    return res.status(404).json({ error: 'Repositorio no encontrado' });
  }

  const files = db.repoFiles[repo.id] || [];
  const commits = db.commits[repo.id] || [];

  res.json({
    repository: repo,
    files,
    commits,
  });
});

app.get('/api/repos/:id/file', (req: Request, res: Response) => {
  db = loadDB();
  const repo = db.repositories.find((r) => r.id === req.params.id || r.name === req.params.id);
  if (!repo) {
    return res.status(404).json({ error: 'Repositorio no encontrado' });
  }

  const filePath = (req.query.path as string) || 'README.md';
  const file = (db.repoFiles[repo.id] || []).find((f) => f.path === filePath);

  if (!file) {
    return res.status(404).json({ error: 'Archivo no encontrado en el repositorio' });
  }

  res.json({ file });
});

app.post('/api/repos/:id/file', (req: Request, res: Response) => {
  const { path: filePath, content, commitMessage, userId } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'Ruta de archivo requerida' });
  }

  db = loadDB();
  const repo = db.repositories.find((r) => r.id === req.params.id || r.name === req.params.id);
  if (!repo) {
    return res.status(404).json({ error: 'Repositorio no encontrado' });
  }

  const files = db.repoFiles[repo.id] || [];
  const existingIndex = files.findIndex((f) => f.path === filePath);
  const now = new Date().toISOString();

  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (existingIndex >= 0) {
    files[existingIndex].content = content;
    files[existingIndex].size = Buffer.byteLength(content || '', 'utf-8');
    files[existingIndex].updatedAt = now;
  } else {
    const filename = path.basename(filePath);
    files.push({
      path: filePath,
      name: filename,
      type: 'file',
      size: Buffer.byteLength(content || '', 'utf-8'),
      content: content || '',
      updatedAt: now,
    });
  }

  // Update readme if README.md
  if (filePath.toLowerCase() === 'readme.md') {
    repo.readme = content;
  }

  repo.updatedAt = now;
  repo.filesCount = files.length;

  // Add commit
  const commitId = crypto.randomBytes(4).toString('hex');
  const commit = {
    id: commitId,
    message: commitMessage || `update: editar ${path.basename(filePath)}`,
    author: user.name,
    authorEmail: user.email,
    timestamp: now,
    filesChangedCount: 1,
  };

  if (!db.commits[repo.id]) db.commits[repo.id] = [];
  db.commits[repo.id].unshift(commit);

  saveDB(db);
  res.json({ success: true, commit, filesCount: files.length });
});

// ==================== TERMINAL CLI SYNC & PUSH ====================

app.get('/api/cli/tokens', (req: Request, res: Response) => {
  db = loadDB();
  res.json({ tokens: db.tokens });
});

app.post('/api/cli/tokens', (req: Request, res: Response) => {
  const { name, userId } = req.body;
  db = loadDB();
  const newToken = {
    id: 'tok_' + Date.now().toString(36),
    name: name || 'Terminal CLI Key',
    token: 'cst_' + crypto.randomBytes(20).toString('hex'),
    userId: userId || db.users[0]?.id,
    createdAt: new Date().toISOString(),
  };
  db.tokens.unshift(newToken);
  saveDB(db);
  res.json({ token: newToken });
});

app.delete('/api/cli/tokens/:id', (req: Request, res: Response) => {
  db = loadDB();
  db.tokens = db.tokens.filter((t) => t.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Endpoint called by Terminal curl / script: POST /api/cli/push?repo=<repo_name>
app.post('/api/cli/push', upload.single('file'), (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  db = loadDB();
  const tokenObj = db.tokens.find((t) => t.token === token);
  const user = tokenObj ? db.users.find((u) => u.id === tokenObj.userId) || db.users[0] : db.users[0];

  const repoQuery = (req.query.repo as string) || (req.body.repo as string);
  if (!repoQuery) {
    return res.status(400).json({ error: 'Parámetro ?repo=<nombre_de_repo> es requerido.' });
  }

  let repo = db.repositories.find((r) => r.name.toLowerCase() === repoQuery.toLowerCase() || r.id === repoQuery);

  // If repo doesn't exist, create it automatically on first terminal push!
  if (!repo) {
    const repoId = 'repo_' + repoQuery.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + Date.now().toString(36);
    repo = {
      id: repoId,
      name: repoQuery.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      description: 'Proyecto subido desde Terminal CLI',
      visibility: 'team',
      ownerId: user.id,
      ownerName: user.name,
      defaultBranch: 'main',
      language: 'Terminal / Shell',
      sizeBytes: req.file ? req.file.size : 1024,
      starsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readme: `# ${repoQuery}\n\nProyecto sincronizado desde la terminal con CloudStation CLI.`,
      filesCount: 1,
    };
    db.repositories.unshift(repo);
    db.repoFiles[repo.id] = [];
    db.commits[repo.id] = [];
  }

  const now = new Date().toISOString();
  const commitMsg = (req.body.message as string) || (req.query.message as string) || 'push: sincronización desde terminal CLI';

  if (req.file) {
    // Add file to repository file list
    const originalName = req.file.originalname;
    const repoFiles = db.repoFiles[repo.id] || [];

    const existingIndex = repoFiles.findIndex((f) => f.path === originalName);
    const item = {
      path: originalName,
      name: originalName,
      type: 'file' as const,
      size: req.file.size,
      content: `// Archivo binario o paquete sincronizado vía CLI: ${originalName} (${(req.file.size / 1024).toFixed(1)} KB)\n// Almacenado en: /uploads/${req.file.filename}`,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      repoFiles[existingIndex] = item;
    } else {
      repoFiles.unshift(item);
    }

    db.repoFiles[repo.id] = repoFiles;
    repo.filesCount = repoFiles.length;
    repo.sizeBytes += req.file.size;
  }

  repo.updatedAt = now;

  // Add commit record
  const commitId = crypto.randomBytes(4).toString('hex');
  const commit = {
    id: commitId,
    message: commitMsg,
    author: user.name + ' (Terminal)',
    authorEmail: user.email,
    timestamp: now,
    filesChangedCount: 1,
  };

  if (!db.commits[repo.id]) db.commits[repo.id] = [];
  db.commits[repo.id].unshift(commit);

  if (tokenObj) {
    tokenObj.lastUsedAt = now;
  }

  saveDB(db);

  res.json({
    success: true,
    message: `Proyecto '${repo.name}' actualizado con éxito desde la terminal.`,
    repo: repo.name,
    commitId,
    timestamp: now,
  });
});

// Serve the portable bash client script
app.get('/api/cli/script', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const bashScript = `#!/usr/bin/env bash
# ==============================================================================
# CloudStation CLI · Guarda tus proyectos desde la terminal
# Uso: cloud-push <nombre_de_repo> [carpeta_o_archivo]
# ==============================================================================

set -e

CLOUD_URL="${baseUrl}"
TOKEN="\${CLOUDSTATION_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: La variable CLOUDSTATION_TOKEN no está configurada."
  echo "Ejecuta primero:"
  echo "  export CLOUDSTATION_TOKEN=\"tu_token_aqui\""
  exit 1
fi

REPO="$1"
TARGET="\${2:-.}"

if [ -z "$REPO" ]; then
  echo "Uso: cloud-push <nombre_repositorio> [directorio_o_archivo]"
  echo "Ejemplo: cloud-push mi-api ."
  exit 1
fi

TEMP_ZIP="/tmp/cloudstation_\$(date +%s).zip"

echo "📦 Empaquetando '$TARGET' para '$REPO'..."

if [ -f "$TARGET" ]; then
  cp "$TARGET" "$TEMP_ZIP"
else
  zip -r "$TEMP_ZIP" "$TARGET" -x "*.git*" -x "*node_modules*" -x "*.DS_Store*" -x "*dist*" -q
fi

echo "🚀 Subiendo a CloudStation ($CLOUD_URL)..."

RESPONSE=\$(curl -s -X POST "$CLOUD_URL/api/cli/push?repo=$REPO" \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@$TEMP_ZIP;filename=$REPO-backup.zip" \\
  -F "message=push terminal: \$(date '+%Y-%m-%d %H:%M:%S')")

rm -f "$TEMP_ZIP"

echo "✅ Respuesta del servidor:"
echo "$RESPONSE"
`;

  res.setHeader('Content-Type', 'text/x-shellscript');
  res.setHeader('Content-Disposition', 'inline; filename="cloud-push.sh"');
  res.send(bashScript);
});

// Serve the Windows PowerShell client script
app.get('/api/cli/powershell', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const psScript = `<#
==============================================================================
CloudStation CLI para Windows PowerShell
Uso: .\\cloud-push.ps1 -Repo <nombre_de_repo> [-Target <carpeta_o_archivo>]
Ejemplo: .\\cloud-push.ps1 mi-api .
==============================================================================
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Repo,

    [Parameter(Mandatory=$false, Position=1)]
    [string]$Target = "."
)

$CloudUrl = "${baseUrl}"
$Token = $env:CLOUDSTATION_TOKEN

if (-not $Token) {
    Write-Host "❌ Error: La variable de entorno CLOUDSTATION_TOKEN no está configurada." -ForegroundColor Red
    Write-Host "Ejecuta primero en tu PowerShell:" -ForegroundColor Yellow
    Write-Host '  $env:CLOUDSTATION_TOKEN = "tu_token_aqui"' -ForegroundColor Cyan
    exit 1
}

$tempZip = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "cloudstation_$([System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).zip")

Write-Host "📦 Empaquetando '$Target' para '$Repo' en Windows..." -ForegroundColor Cyan

$resolvedTarget = Resolve-Path $Target
if (Test-Path -Path $resolvedTarget -PathType Leaf) {
    Compress-Archive -Path $resolvedTarget -DestinationPath $tempZip -Force
} else {
    # Comprimir archivos excluyendo carpetas pesadas
    Get-ChildItem -Path $resolvedTarget -Exclude 'node_modules', '.git', 'dist', '.DS_Store', '*.log' | Compress-Archive -DestinationPath $tempZip -Force
}

Write-Host "🚀 Subiendo a CloudStation ($CloudUrl)..." -ForegroundColor Green

try {
    $uri = "$CloudUrl/api/cli/push?repo=$Repo"
    $response = & curl.exe -s -X POST $uri -H "Authorization: Bearer $Token" -F "file=@$tempZip;filename=$Repo-backup.zip" -F "message=push windows powershell: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "✅ Respuesta del servidor:" -ForegroundColor Green
    Write-Host $response
} catch {
    Write-Host "❌ Error al subir: $_" -ForegroundColor Red
} finally {
    if (Test-Path $tempZip) {
        Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    }
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="cloud-push.ps1"');
  res.send(psScript);
});

// Serve cross-platform Python client script
app.get('/api/cli/python', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const pythonScript = `#!/usr/bin/env python3
"""
CloudStation CLI Multiplataforma (Windows, Mac, Linux)
Uso: python cloud-push.py <nombre_de_repo> [directorio]
"""
import os
import sys
import zipfile
import tempfile
import urllib.request
import urllib.parse
from datetime import datetime

CLOUD_URL = "${baseUrl}"
TOKEN = os.environ.get("CLOUDSTATION_TOKEN", "")

if not TOKEN:
    print("❌ Error: Variable CLOUDSTATION_TOKEN no configurada.")
    print("En Windows CMD/PowerShell:")
    print("  set CLOUDSTATION_TOKEN=tu_token   (CMD)")
    print('  $env:CLOUDSTATION_TOKEN = "tu_token" (PowerShell)')
    sys.exit(1)

if len(sys.argv) < 2:
    print("Uso: python cloud-push.py <nombre_repositorio> [carpeta]")
    sys.exit(1)

repo = sys.argv[1]
target = sys.argv[2] if len(sys.argv) > 2 else "."

temp_zip = os.path.join(tempfile.gettempdir(), f"cloudstation_{int(datetime.now().timestamp())}.zip")
print(f"📦 Empaquetando '{target}' para '{repo}'...")

ignored = {"node_modules", ".git", "dist", ".DS_Store", "__pycache__"}

with zipfile.ZipFile(temp_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    if os.path.isfile(target):
        z.write(target, os.path.basename(target))
    else:
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in ignored]
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, target)
                z.write(full_path, rel_path)

print(f"🚀 Subiendo a CloudStation ({CLOUD_URL})...")

boundary = "----CloudStationBoundary" + hex(int(datetime.now().timestamp()))[2:]
with open(temp_zip, 'rb') as f:
    zip_bytes = f.read()

body = bytearray()
body.extend(f"--{boundary}\\r\\n".encode())
body.extend(f'Content-Disposition: form-data; name="file"; filename="{repo}-backup.zip"\\r\\n'.encode())
body.extend(b"Content-Type: application/zip\\r\\n\\r\\n")
body.extend(zip_bytes)
body.extend(b"\\r\\n")
body.extend(f"--{boundary}\\r\\n".encode())
body.extend(b'Content-Disposition: form-data; name="message"\\r\\n\\r\\n')
body.extend(f"push python windows: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".encode())
body.extend(b"\\r\\n")
body.extend(f"--{boundary}--\\r\\n".encode())

url = f"{CLOUD_URL}/api/cli/push?repo={urllib.parse.quote(repo)}"
req = urllib.request.Request(url, data=bytes(body), method="POST")
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

try:
    with urllib.request.urlopen(req) as resp:
        print("✅ Respuesta del servidor:")
        print(resp.read().decode())
finally:
    if os.path.exists(temp_zip):
        os.remove(temp_zip)
`;

  res.setHeader('Content-Type', 'text/x-python');
  res.setHeader('Content-Disposition', 'inline; filename="cloud-push.py"');
  res.send(pythonScript);
});

// ==================== SYSTEM & DEPLOYMENT INFO ====================

app.get('/api/system/info', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const detectedUrl = `${protocol}://${host}`;
  db = loadDB();

  res.json({
    host,
    detectedUrl,
    usersCount: db.users.length,
    reposCount: db.repositories.length,
    filesCount: db.files.length,
    storageTotalBytes: db.users.reduce((acc, u) => acc + (u.storageUsedBytes || 0), 0),
    maxUsers: 10,
  });
});

// Setup Vite or static serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 CloudStation corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
