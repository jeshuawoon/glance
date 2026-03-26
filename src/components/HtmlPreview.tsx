interface HtmlPreviewProps {
  content: string;
}

export function HtmlPreview({ content }: HtmlPreviewProps) {
  // Use srcdoc to render HTML content in a sandboxed iframe
  return (
    <iframe
      className="html-preview"
      srcDoc={content}
      sandbox="allow-scripts allow-same-origin"
      title="HTML Preview"
    />
  );
}
