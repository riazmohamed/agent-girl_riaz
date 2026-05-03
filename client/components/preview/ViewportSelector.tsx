import { Monitor, Laptop, Tablet, Smartphone, RotateCcw } from 'lucide-react';
import { usePreviewStore, VIEWPORT_PRESETS } from '../../stores/previewStore';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor size={14} />,
  laptop: <Laptop size={14} />,
  ipad: <Tablet size={14} />,
  'iphone-15': <Smartphone size={14} />,
  'pixel-8': <Smartphone size={14} />,
  'iphone-se': <Smartphone size={14} />,
};

export function ViewportSelector() {
  const { viewportPreset, setViewportPreset, orientation, setOrientation } = usePreviewStore();

  const currentPreset = VIEWPORT_PRESETS.find(p => p.name === viewportPreset);
  const showOrientationToggle = currentPreset?.supportsOrientation ?? false;

  return (
    <div className="viewport-selector">
      <div className="viewport-buttons">
        {VIEWPORT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className={`viewport-btn ${viewportPreset === preset.name ? 'viewport-btn-active' : ''}`}
            onClick={() => setViewportPreset(preset.name)}
            title={`${preset.label} (${preset.width}x${preset.height})`}
          >
            {PRESET_ICONS[preset.name]}
            <span className="viewport-btn-label">{preset.label}</span>
          </button>
        ))}
      </div>

      {showOrientationToggle && (
        <button
          className="viewport-btn viewport-orientation-btn"
          onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
          title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}
