export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  storageUsedBytes: number;
  token?: string;
  createdAt: string;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  createdAt: string;
  usedBy?: string;
  isUsed: boolean;
  expiresAt?: string;
}

export interface CloudFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';
  url: string;
  folderId?: string | null;
  uploadedBy: string;
  uploadedByName: string;
  isFromMobile?: boolean;
  device?: string;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  parentId?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface RepoCommit {
  id: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  filesChangedCount: number;
}

export interface RepoFileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  content?: string;
  children?: RepoFileNode[];
}

export interface Repository {
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
  lastCommit?: RepoCommit;
  createdAt: string;
  updatedAt: string;
  readme?: string;
  filesCount: number;
}

export interface PersonalAccessToken {
  id: string;
  name: string;
  token: string;
  userId: string;
  createdAt: string;
  lastUsedAt?: string;
}
