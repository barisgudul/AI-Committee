// types/FileTypes.ts

/**
 * Yüklenen dosya için tip tanımı
 */
export interface UploadedFile {
  id: string; // UUID
  name: string; // Dosya adı
  path: string; // Klasör yolu (relative path)
  type: string; // Dosya uzantısı (.ts, .tsx, vb.)
  size: number; // Dosya boyutu (bytes)
  content: string; // Dosya içeriği
  uploadedAt: number; // Yüklenme zamanı (timestamp)
  language?: string; // Programlama dili (syntax highlighting için)
}

/**
 * Dosya analiz talebi
 */
export interface FileAnalysisRequest {
  files: UploadedFile[];
  analysisType: 'full' | 'security' | 'performance' | 'structure' | 'custom';
  task?: string; // Özel analiz görevi
  history?: Array<{ role: string; parts: Array<{ text: string }> }>; // Konuşma geçmişi
}

/**
 * Dosya yükleme durumu
 */
export interface FileUploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  message?: string;
  error?: string;
}

/**
 * Dosya validasyon sonucu
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Desteklenen dosya tipleri
 */
export const SUPPORTED_FILE_TYPES = [
  // JavaScript/TypeScript
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  // Python
  '.py', '.pyw', '.pyx',
  // Java
  '.java', '.kt', '.scala',
  // Go
  '.go',
  // Rust
  '.rs',
  // C/C++/Objective-C
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh',
  '.m', '.mm', // Objective-C, Objective-C++
  // C#
  '.cs',
  // Ruby
  '.rb',
  // PHP
  '.php',
  // Swift
  '.swift',
  // Dart
  '.dart',
  // Lua
  '.lua',
  // R
  '.r', '.R',
  // Vim
  '.vim',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  // Data formats
  '.json', '.json5', '.xml', '.yaml', '.yml', '.toml',
  // Markdown
  '.md', '.markdown', '.mdx', '.mdown',
  // Plain text
  '.txt', '.text',
  // Shell scripts
  '.sh', '.bash', '.zsh', '.fish',
  // Database
  '.sql', '.graphql',
  // Protobuf
  '.proto',
  // Config files (no extension)
  'dockerfile', 'makefile', 'cmakefile',
  // Config extensions
  '.ini', '.conf', '.cfg', '.config',
  // Environment & config
  '.env', '.env.local', '.env.example', '.env.development', '.env.production',
  '.gitignore', '.dockerignore', '.gitattributes',
  '.editorconfig', '.eslintrc', '.eslintignore',
  '.prettierrc', '.prettierignore',
  '.npmrc', '.nvmrc',
  '.babelrc', '.browserlistrc',
  // Package files
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  // Config files
  'tsconfig.json', 'jsconfig.json',
  'next.config.js', 'next.config.ts', 'next.config.mjs',
  'tailwind.config.js', 'tailwind.config.ts',
  'webpack.config.js', 'webpack.config.ts',
  'vite.config.js', 'vite.config.ts',
  'vitest.config.js', 'vitest.config.ts',
  'jest.config.js', 'jest.config.ts',
  'docker-compose.yml', 'docker-compose.yaml',
  // Standard files
  'readme', 'license', 'changelog', 'contributing', 'authors', 'code_of_conduct',
  // Alembic files
  'alembic.ini',
  // Lock files
  '.lock',
] as const;

/**
 * Dosya boyutu limitleri
 */
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB per file (dosya başına maksimum)
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB total (artırıldı: 50MB → 100MB)
  MAX_FILE_COUNT: 1000, // 1000 files max (artırıldı: 100 → 1000)
} as const;

/**
 * Dosya tipinden programlama dilini tespit et
 */
export function getLanguageFromFileType(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.m': 'objectivec',
    '.mm': 'objectivecpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.dart': 'dart',
    '.scala': 'scala',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.txt': 'text',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.fish': 'bash',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.proto': 'protobuf',
    '.env': 'text',
    '.env.local': 'text',
    '.env.example': 'text',
    '.gitignore': 'text',
    '.dockerignore': 'text',
    '.eslintrc': 'json',
    '.eslintignore': 'text',
    '.prettierrc': 'json',
    '.prettierignore': 'text',
    '.babelrc': 'json',
    '.npmrc': 'text',
    '.nvmrc': 'text',
    '.editorconfig': 'text',
    'package.json': 'json',
    'package-lock.json': 'json',
    'yarn.lock': 'text',
    'pnpm-lock.yaml': 'yaml',
    'tsconfig.json': 'json',
    'next.config.js': 'javascript',
    'next.config.ts': 'typescript',
    'tailwind.config.js': 'javascript',
    'tailwind.config.ts': 'typescript',
    'webpack.config.js': 'javascript',
    'vite.config.js': 'javascript',
    'vite.config.ts': 'typescript',
    'vitest.config.ts': 'typescript',
    'jest.config.js': 'javascript',
    'dockerfile': 'docker',
    'docker-compose.yml': 'yaml',
    'docker-compose.yaml': 'yaml',
    'makefile': 'makefile',
    'cmake': 'cmake',
    '.lua': 'lua',
    '.vim': 'vim',
    '.r': 'r',
    '.R': 'r',
    // Config
    '.ini': 'ini',
    '.conf': 'conf',
    '.cfg': 'text',
    '.config': 'text',
    'alembic.ini': 'ini',
  };
  
  return languageMap[ext.toLowerCase()] || languageMap[fileName.toLowerCase()] || 'text';
}

/**
 * Dosya boyutunu insan okunabilir formata çevir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

