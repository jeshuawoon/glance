/**
 * Extract npm package names from import statements in source code.
 * Filters out relative imports and returns unique package names.
 */
export function parseImports(code: string): string[] {
  const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  const packages = new Set<string>();

  const extractPackageName = (specifier: string): string | null => {
    // Skip relative imports
    if (specifier.startsWith('.') || specifier.startsWith('/')) return null;

    // Handle scoped packages: @scope/package/sub → @scope/package
    if (specifier.startsWith('@')) {
      const parts = specifier.split('/');
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      return null;
    }

    // Regular package: package/sub → package
    return specifier.split('/')[0];
  };

  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(code)) !== null) {
    const pkg = extractPackageName(match[1]);
    if (pkg) packages.add(pkg);
  }

  while ((match = requireRegex.exec(code)) !== null) {
    const pkg = extractPackageName(match[1]);
    if (pkg) packages.add(pkg);
  }

  // Filter out React since Sandpack includes it
  packages.delete('react');
  packages.delete('react-dom');
  packages.delete('react/jsx-runtime');

  return Array.from(packages);
}
