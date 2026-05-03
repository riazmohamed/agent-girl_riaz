import { Globe, MonitorPlay } from 'lucide-react';
import { usePreviewStore } from '../../stores/previewStore';
import { useState } from 'react';

export function PreviewEmptyState() {
  const { setPreviewUrl, setLoading } = usePreviewStore();
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    setPreviewUrl(url);
    setLoading(true);
  };

  return (
    <div className="preview-empty-state">
      <MonitorPlay size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
      <h3 className="preview-empty-title">Live Preview</h3>
      <p className="preview-empty-description">
        Enter a localhost URL to preview your web app, or start a dev server to auto-detect it.
      </p>

      <form onSubmit={handleSubmit} className="preview-empty-form">
        <div className="preview-empty-input-wrapper">
          <Globe size={14} style={{ opacity: 0.5 }} />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="http://localhost:3000"
            className="preview-empty-input"
          />
        </div>
        <button type="submit" className="preview-empty-submit" disabled={!urlInput.trim()}>
          Preview
        </button>
      </form>

      <div className="preview-empty-hints">
        <p>Common dev servers:</p>
        <div className="preview-empty-hint-buttons">
          {['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:4200'].map(url => (
            <button
              key={url}
              className="preview-hint-btn"
              onClick={() => {
                setPreviewUrl(url);
                setLoading(true);
              }}
            >
              {url.replace('http://', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
