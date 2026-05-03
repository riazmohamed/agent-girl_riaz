import { usePreviewStore, VIEWPORT_PRESETS } from '../../stores/previewStore';
import { PreviewToolbar } from './PreviewToolbar';
import { PreviewFrame } from './PreviewFrame';
import { DeviceFrame } from './DeviceFrame';
import { PreviewEmptyState } from './PreviewEmptyState';
import { ExpoQRPreview } from './ExpoQRPreview';
import { SimulatorPreview } from './SimulatorPreview';

export function LivePreviewPanel() {
  const {
    previewMode,
    previewUrl,
    viewportPreset,
    orientation,
    nativeSubMode,
  } = usePreviewStore();

  const currentPreset = VIEWPORT_PRESETS.find(p => p.name === viewportPreset);

  return (
    <div className="preview-panel">
      <PreviewToolbar />

      <div className="preview-content">
        {previewMode === 'web' && (
          <>
            {!previewUrl ? (
              <PreviewEmptyState />
            ) : currentPreset?.hasFrame && currentPreset.frameType ? (
              <div className="preview-device-wrapper">
                <DeviceFrame
                  frameType={currentPreset.frameType}
                  width={currentPreset.width}
                  height={currentPreset.height}
                  orientation={orientation}
                >
                  <PreviewFrame />
                </DeviceFrame>
              </div>
            ) : (
              <div
                className="preview-viewport-wrapper"
                style={{
                  maxWidth: currentPreset ? `${currentPreset.width}px` : '100%',
                  maxHeight: currentPreset ? `${currentPreset.height}px` : '100%',
                }}
              >
                <PreviewFrame />
              </div>
            )}
          </>
        )}

        {previewMode === 'native' && (
          <>
            {nativeSubMode === 'expo' && <ExpoQRPreview />}
            {(nativeSubMode === 'ios-simulator' || nativeSubMode === 'android') && (
              <SimulatorPreview />
            )}
          </>
        )}
      </div>
    </div>
  );
}
