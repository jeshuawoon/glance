import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import chokidar from 'chokidar';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json());

let targetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd());

// Array of connected SSE UI clients
const clients = new Set<express.Response>();

app.get('/api/watch', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

let reloadTimeout: NodeJS.Timeout;
function broadcastReload() {
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    for (const client of clients) {
      client.write(`data: ${JSON.stringify({ type: 'reload' })}\n\n`);
    }
  }, 50); // Debounce extremely fast I/O burst signals 
}

let watcher: any = null;
function setupWatcher(dir: string) {
  if (watcher) watcher.close();
  watcher = chokidar.watch(dir, {
    ignored: [/node_modules/, /(^|[\/\\])\../, /\.git/], // Ignore dense standard non-source binaries
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', () => {
    broadcastReload();
  });
}

// Boot the FS watcher immediately
setupWatcher(targetDir);

const SUPPORTED_EXTENSIONS = ['.tsx', '.jsx', '.md', '.mdx', '.html', '.svg'];

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

function buildFileTree(dirPath: string, basePath: string = ''): FileNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  // Sort: directories first, then files, alphabetically
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dirPath, entry.name);

    // Skip hidden files/dirs and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, relativePath);
      // Only include directories that contain supported files
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
        });
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          extension: ext,
        });
      }
    }
  }

  return nodes;
}

// GET /api/files — returns the file tree
app.get('/api/files', (_req, res) => {
  try {
    if (!fs.existsSync(targetDir)) {
      res.status(404).json({ error: 'Directory not found' });
      return;
    }
    const tree = buildFileTree(targetDir);
    res.json({ root: targetDir, tree });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read directory', details: String(err) });
  }
});

// GET /api/file?path=... — returns raw file content
app.get('/api/file', (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    // Path traversal protection
    const resolved = path.resolve(targetDir, filePath);
    if (!resolved.startsWith(targetDir)) {
      res.status(403).json({ error: 'Access denied: path traversal detected' });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const content = fs.readFileSync(resolved, 'utf-8');
    const ext = path.extname(resolved).toLowerCase();
    res.json({ content, extension: ext, path: filePath });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file', details: String(err) });
  }
});

// POST /api/set-directory — change the target directory
app.post('/api/set-directory', (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) {
      res.status(400).json({ error: 'Missing directory parameter' });
      return;
    }

    const resolved = path.resolve(directory);
    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Directory not found' });
      return;
    }

    if (!fs.statSync(resolved).isDirectory()) {
      res.status(400).json({ error: 'Path is not a directory' });
      return;
    }

    targetDir = resolved;
    setupWatcher(targetDir); // Update watcher to point to new OS project directory
    const tree = buildFileTree(targetDir);
    res.json({ root: targetDir, tree });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set directory', details: String(err) });
  }
});

// GET /api/pick-folder — native OS folder picker (Universal)
app.get('/api/pick-folder', (req, res) => {
  try {
    let command = '';
    if (process.platform === 'darwin') {
      command = `osascript -e 'POSIX path of (choose folder)'`;
    } else if (process.platform === 'win32') {
      command = `powershell.exe -Command "(New-Object -ComObject Shell.Application).BrowseForFolder(0, 'Select project folder', 0, 0).self.path"`;
    } else if (process.platform === 'linux') {
      command = `zenity --file-selection --directory 2>/dev/null || kdialog --getexistingdirectory /`;
    } else {
      res.status(400).json({ error: 'Native folder picker is unsupported on this OS. Please type the path manually.' });
      return;
    }

    exec(command, (error, stdout) => {
      if (error) {
        // Non-zero exit code usually means user hit "Cancel"
        res.status(200).json({ cancelled: true });
        return;
      }
      const pickedPath = stdout.trim();
      if (!pickedPath) {
        res.status(200).json({ cancelled: true });
        return;
      }
      res.json({ pickedPath, cancelled: false });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to open directory picker', details: String(err) });
  }
});

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`\n  🔍 Glance API server safely bound to http://127.0.0.1:${PORT}`);
  console.log(`  📁 Watching: ${targetDir}\n`);
});
