interface SvgPreviewProps {
  content: string;
  filename: string;
}

export function SvgPreview({ content, filename }: SvgPreviewProps) {
  return (
    <div className="svg-preview">
      <div className="svg-preview-container">
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <div className="svg-preview-meta">
          {filename} · {(content.length / 1024).toFixed(1)} KB
        </div>
      </div>
    </div>
  );
}
