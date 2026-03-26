import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import { parseImports } from '../utils/parseImports';

interface CodePreviewProps {
  content: string;
  filename: string;
  extension: string;
  showCode: boolean;
}

export function CodePreview({ content, filename, extension, showCode }: CodePreviewProps) {
  const dependencies = parseImports(content);
  const depsMap: Record<string, string> = {};
  for (const dep of dependencies) {
    depsMap[dep] = 'latest';
  }

  // Wrap the content to ensure it has a default export rendering
  const wrappedContent = ensureDefaultExport(content, filename);

  // 56px header + 40px preview-header = 96px of chrome
  const layoutHeight = 'calc(100vh - 96px)';

  return (
    <div className="code-preview" style={{ height: layoutHeight }}>
      <SandpackProvider
        template={extension === '.tsx' ? 'react-ts' : 'react'}
        files={{
          [extension === '.tsx' ? '/App.tsx' : '/App.js']: {
            code: wrappedContent,
            active: true
          },
        }}
        customSetup={{
          dependencies: depsMap,
        }}
        theme="dark"
        options={{
          externalResources: [],
        }}
      >
        <SandpackLayout
          style={{
            height: layoutHeight,
            minHeight: layoutHeight,
            maxHeight: layoutHeight,
            border: 'none',
            borderRadius: 0,
          }}
        >
          {showCode && (
            <SandpackCodeEditor
              showTabs={false}
              showLineNumbers
              style={{ flex: '0 0 50%', height: '100%' }}
            />
          )}
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ flex: '1', height: '100%' }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

/**
 * Ensures the code has a default export that renders something.
 * If it already has a default export, use it as-is.
 * Otherwise, try to find the first exported component and wrap it.
 */
function ensureDefaultExport(code: string, filename: string): string {
  // If it already has a default export, return as-is
  if (/export\s+default\s/.test(code)) {
    return code;
  }

  // Try to find named exports that look like React components
  const namedExportMatch = code.match(
    /export\s+(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/
  );

  if (namedExportMatch) {
    const componentName = namedExportMatch[1];
    return `${code}\n\nexport default ${componentName};`;
  }

  // If no exports found, wrap the entire content assuming it's JSX
  const baseName = filename.replace(/\.(tsx|jsx)$/, '');
  const componentName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  return `${code}\n\n// Auto-generated default export\nexport default function ${componentName}Preview() {\n  return <>${componentName} component</>;\n}`;
}
