import { useState, useCallback, useEffect } from 'react';

interface FolderPickerProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  showToast: (message: string, type?: 'error' | 'success') => void;
}

export function FolderPicker({ currentPath, onNavigate, showToast }: FolderPickerProps) {
  const [inputValue, setInputValue] = useState(currentPath);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputValue(currentPath);
  }, [currentPath]);

  const handleSubmitManualPath = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === currentPath) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/set-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to open directory', 'error');
        setInputValue(currentPath);
        return;
      }

      onNavigate(trimmed);
    } catch {
      showToast('Failed to connect to server', 'error');
      setInputValue(currentPath);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, currentPath, onNavigate]);

  const handleBrowse = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Ask backend to show native folder picker
      const res = await fetch('/api/pick-folder');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Native folder picker is unsupported on this OS. Type path manually.', 'error');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.cancelled || !data.pickedPath) {
        setIsLoading(false);
        return;
      }

      // 2. Set the directory on the backend using the new absolute path
      const setRes = await fetch('/api/set-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: data.pickedPath }),
      });

      if (!setRes.ok) {
        const errData = await setRes.json();
        showToast(errData.error || 'Failed to open directory', 'error');
        setIsLoading(false);
        return;
      }

      // 3. Navigate frontend to new path
      onNavigate(data.pickedPath);
    } catch {
      showToast('Failed to connect to server. Did it restart?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onNavigate]);

  return (
    <div className="folder-picker">
      <input 
        type="text"
        className="folder-picker-input" 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmitManualPath()}
        placeholder="/path/to/your/project"
        spellCheck={false}
        title={currentPath}
      />
      <button
        className="folder-picker-btn"
        onClick={handleBrowse}
        disabled={isLoading}
        title="Open OS folder picker"
      >
        ...
      </button>
    </div>
  );
}
