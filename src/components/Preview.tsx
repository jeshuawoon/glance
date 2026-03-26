import { CodePreview } from './CodePreview';
import { MarkdownPreview } from './MarkdownPreview';
import { HtmlPreview } from './HtmlPreview';
import { SvgPreview } from './SvgPreview';

interface PreviewProps {
  content: string;
  extension: string;
  filename: string;
  showCode?: boolean;
}

export function Preview({ content, extension, filename, showCode = false }: PreviewProps) {
  switch (extension) {
    case '.tsx':
    case '.jsx':
      return <CodePreview content={content} filename={filename} extension={extension} showCode={showCode} />;
    case '.md':
    case '.mdx':
      return <MarkdownPreview content={content} />;
    case '.html':
      return <HtmlPreview content={content} />;
    case '.svg':
      return <SvgPreview content={content} filename={filename} />;
    default:
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-title">Unsupported file type</div>
          <div className="empty-state-text">
            Extension "{extension}" is not supported for preview.
          </div>
        </div>
      );
  }
}
