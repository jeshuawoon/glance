import { useState, useEffect, useCallback } from 'react';
import { FileTree } from './components/FileTree';
import { Preview } from './components/Preview';
import { FolderPicker } from './components/FolderPicker';
import './index.css';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

interface FileData {
  content: string;
  extension: string;
  path: string;
}

export default function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string>('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'error' | 'success' } | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  const fetchFileTree = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoadingTree(true);
    setError(null);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.tree);
      if (!silent) setRootPath(data.root);
    } catch (err) {
      if (!silent) {
        setError('Failed to connect to Glance server. Is it running?');
        showToast('Failed to connect to Glance server. Is it running?', 'error');
      }
      console.error(err);
    } finally {
      if (!silent) setIsLoadingTree(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // Hot Reload Hook
  useEffect(() => {
    const sse = new EventSource('http://localhost:3001/api/watch');
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'reload') {
          fetchFileTree(true); // Soft-reload the file tree without UI spinners
        }
      } catch (err) {
        // Ignore
      }
    };
    return () => sse.close();
  }, [fetchFileTree]);

  // Global catch-all for unhandled errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      showToast(event.message || 'Something went wrong!', 'error');
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      showToast(event.reason?.message || event.reason || 'An unexpected error occurred!', 'error');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showToast]);

  const handleSelectFile = useCallback(async (filePath: string) => {
    setSelectedPath(filePath);
    setIsLoadingFile(true); // Use combined loading state
    setError(null);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error('Failed to fetch file');
      const data = await res.json();
      setFileData(data);
    } catch (err) {
      setError('Failed to load file content');
      console.error(err);
      showToast('Failed to load file content', 'error');
    } finally {
      setIsLoadingFile(false); // Use combined loading state
    }
  }, [showToast]);

  const handleNavigate = useCallback(
    (newPath: string) => {
      setSelectedPath(null);
      setFileData(null);
      setRootPath(newPath);
      fetchFileTree();
    },
    [fetchFileTree]
  );

  const getFilename = (filePath: string) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <span style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: '15px' }}>Glance</span>
        </div>
        <FolderPicker currentPath={rootPath} onNavigate={handleNavigate} showToast={showToast} />
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-header">Explorer</div>
          <div className="sidebar-content">
            {isLoadingTree ? ( // Use combined loading state
              <div className="loading" style={{ padding: '32px' }}>
                <div className="loading-spinner" />
                <span>Loading…</span>
              </div>
            ) : (
              <FileTree
                files={files}
                selectedPath={selectedPath}
                onSelectFile={handleSelectFile}
              />
            )}
          </div>
        </aside>

        <main className="main-content">
          {error && <div className="error-banner">{error}</div>}

          {selectedPath && fileData && (
            <div className="preview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="preview-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className={`file-badge ${fileData.extension.replace('.', '')}`}
                >
                  {fileData.extension.toUpperCase()}
                </span>
                <span className="preview-header-filename">
                  {getFilename(selectedPath)}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="header-toggle-btn"
                  onClick={() => setReloadKey(k => k + 1)}
                  title="Reload compilation environment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  Reload
                </button>

                {(fileData.extension === '.tsx' || fileData.extension === '.jsx') && (
                  <button
                    className="header-toggle-btn"
                    onClick={() => setShowCode(!showCode)}
                    title={showCode ? 'Hide code view' : 'Show code view'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    {showCode ? 'Hide Code' : 'Show Code'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="preview-container">
            {isLoadingFile && selectedPath ? (
              <div className="loading">
                <div className="loading-spinner" />
                <span>Loading preview…</span>
              </div>
            ) : fileData ? (
              <Preview
                key={`${fileData.path}-${reloadKey}`}
                content={fileData.content}
                extension={fileData.extension}
                filename={getFilename(selectedPath!)}
                showCode={showCode}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div className="empty-state-title">Welcome to Glance</div>
                <div className="empty-state-text">
                  Select a file from the sidebar to preview it.
                  Supports .tsx, .jsx, .md, .html, and .svg files.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className="toast-container">
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span style={{ fontSize: '16px', color: toast.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
              {toast.type === 'error' ? '⚠️' : '✅'}
            </span>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
