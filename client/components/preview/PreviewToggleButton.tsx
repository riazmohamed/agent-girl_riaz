import { MonitorPlay } from 'lucide-react';
import { usePreviewStore } from '../../stores/previewStore';

export function PreviewToggleButton() {
  const { isPreviewOpen, togglePreview } = usePreviewStore();

  return (
    <button
      className="header-btn"
      aria-label={isPreviewOpen ? 'Close Preview' : 'Open Preview'}
      onClick={togglePreview}
      title={isPreviewOpen ? 'Close Preview' : 'Open Preview'}
    >
      <MonitorPlay
        style={{
          opacity: isPreviewOpen ? 1 : 0.8,
          color: isPreviewOpen ? 'rgb(218, 238, 255)' : undefined,
        }}
      />
    </button>
  );
}
