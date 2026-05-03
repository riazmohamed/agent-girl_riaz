import { useState } from 'react';
import { RefreshCw, ExternalLink, X, Globe } from 'lucide-react';
import { usePreviewStore } from '../../stores/previewStore';
import type { PreviewMode } from '../../stores/previewStore';
import { ViewportSelector } from './ViewportSelector';

export function PreviewToolbar() {
  const {
    previewMode,
    setPreviewMode,
    previewUrl,
    setPreviewUrl,
    refreshPreview,
    closePreview,
    setLoading,
    nativeSubMode,
    setNativeSubMode,
  } = usePreviewStore();

  const [urlInput, setUrlInput] = useState(previewUrl);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    setPreviewUrl(url);
    setLoading(true);
    setUrlInput(url);
  };

  const handleModeChange = (mode: PreviewMode) => {
    setPreviewMode(mode);
  };

  return (
    <div className="preview-toolbar">
      {/* Top row: mode toggle + URL + actions */}
      <div className="preview-toolbar-row">
        {/* Mode toggle */}
        <div className="preview-mode-toggle">
          <button
            className={`preview-mode-btn ${previewMode === 'web' ? 'preview-mode-btn-active' : ''}`}
            onClick={() => handleModeChange('web')}
          >
            Web
          </button>
          <button
            className={`preview-mode-btn ${previewMode === 'native' ? 'preview-mode-btn-active' : ''}`}
            onClick={() => handleModeChange('native')}
          >
            Native
          </button>
        </div>

        {/* URL bar (web mode) */}
        {previewMode === 'web' && (
          <form onSubmit={handleUrlSubmit} className="preview-url-form">
            <Globe size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3000"
              className="preview-url-input"
            />
          </form>
        )}

        {/* Native sub-mode (native mode) */}
        {previewMode === 'native' && (
          <div className="preview-native-tabs">
            <button
              className={`preview-mode-btn ${nativeSubMode === 'expo' ? 'preview-mode-btn-active' : ''}`}
              onClick={() => setNativeSubMode('expo')}
            >
              Expo QR
            </button>
            <button
              className={`preview-mode-btn ${nativeSubMode === 'ios-simulator' ? 'preview-mode-btn-active' : ''}`}
              onClick={() => setNativeSubMode('ios-simulator')}
            >
              iOS Sim
            </button>
            <button
              className={`preview-mode-btn ${nativeSubMode === 'android' ? 'preview-mode-btn-active' : ''}`}
              onClick={() => setNativeSubMode('android')}
            >
              Android
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="preview-toolbar-actions">
          {previewMode === 'web' && (
            <>
              <button
                className="preview-action-btn"
                onClick={refreshPreview}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              <button
                className="preview-action-btn"
                onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                title="Open in browser"
                disabled={!previewUrl}
              >
                <ExternalLink size={14} />
              </button>
            </>
          )}
          <button
            className="preview-action-btn"
            onClick={closePreview}
            title="Close preview"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Second row: viewport selector (web mode only) */}
      {previewMode === 'web' && (
        <div className="preview-toolbar-row preview-toolbar-row-secondary">
          <ViewportSelector />
        </div>
      )}
    </div>
  );
}
