import { useState } from 'react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth?: number;
}

export function FileTree({ files, selectedPath, onSelectFile, depth = 0 }: FileTreeProps) {
  if (files.length === 0 && depth === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 16px' }}>
        <div className="empty-state-icon">📂</div>
        <div className="empty-state-text">
          No previewable files found. Supported: .tsx, .jsx, .md, .html, .svg
        </div>
      </div>
    );
  }

  // Sort: directories first, then alphabetical
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });

  return (
    <>
      {sortedFiles.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={depth}
        />
      ))}
    </>
  );
}

function FileTreeNode({
  node,
  selectedPath,
  onSelectFile,
  depth,
}: {
  node: FileNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedPath === node.path;

  if (node.type === 'directory') {
    return (
      <div className="file-tree-node">
        <div
          className="tree-item"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`tree-arrow ${isOpen ? 'open' : ''}`}>▶</span>
          <span className="tree-name" style={{ marginLeft: '4px' }}>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <FileTree
            files={node.children}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            depth={depth + 1}
          />
        )}
      </div>
    );
  }

  // Only keep the extension part without the dot for the CSS class
  const badgeClass = node.extension ? node.extension.replace('.', '') : 'default';
  const badgeText = node.extension ? node.extension.toUpperCase() : 'FILE';

  return (
    <div className="file-tree-node">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onSelectFile(node.path)}
      >
        <span className={`file-badge ${badgeClass}`} style={{ marginRight: '8px', minWidth: '32px' }}>
          {badgeText}
        </span>
        <span className="tree-name">{node.name}</span>
      </div>
    </div>
  );
}
