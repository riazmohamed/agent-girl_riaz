import { usePreviewStore } from '../../stores/previewStore';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export function PreviewFrame() {
  const { previewUrl, refreshKey, isLoading, hasError, setLoading, setError } = usePreviewStore();

  const proxyUrl = previewUrl
    ? `/api/preview/proxy?url=${encodeURIComponent(previewUrl)}`
    : '';

  if (!previewUrl) {
    return null;
  }

  return (
    <div className="preview-frame-container">
      {isLoading && (
        <div className="preview-loading-overlay">
          <Loader2 size={24} className="preview-spinner" />
          <span>Loading preview...</span>
        </div>
      )}

      {hasError && (
        <div className="preview-error-overlay">
          <AlertCircle size={24} />
          <span>Failed to load preview</span>
          <button
            className="preview-retry-btn"
            onClick={() => {
              setError(false);
              setLoading(true);
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      <iframe
        key={refreshKey}
        src={proxyUrl}
        className="preview-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Live Preview"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
