import { usePreviewStore } from '../../stores/previewStore';
import { Power, RefreshCw } from 'lucide-react';

interface SimulatorControlsProps {
  onBootDevice: (deviceId: string) => void;
  onStartStreaming: (deviceId: string) => void;
  onStopStreaming: () => void;
  onRefreshDevices: () => void;
}

export function SimulatorControls({
  onBootDevice,
  onStartStreaming,
  onStopStreaming,
  onRefreshDevices,
}: SimulatorControlsProps) {
  const {
    simulatorDevices,
    selectedDeviceId,
    setSelectedDevice,
    simulatorStatus,
  } = usePreviewStore();

  const selectedDevice = simulatorDevices.find(d => d.id === selectedDeviceId);
  const isStreaming = simulatorStatus === 'streaming';

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDevice(deviceId || null);

    if (isStreaming) {
      onStopStreaming();
    }
  };

  const handleAction = () => {
    if (!selectedDeviceId) return;

    if (isStreaming) {
      onStopStreaming();
    } else if (selectedDevice?.state === 'booted') {
      onStartStreaming(selectedDeviceId);
    } else {
      onBootDevice(selectedDeviceId);
    }
  };

  return (
    <div className="simulator-controls">
      <select
        value={selectedDeviceId || ''}
        onChange={handleDeviceChange}
        className="simulator-device-select"
      >
        <option value="">Select device...</option>
        {simulatorDevices.map(device => (
          <option key={device.id} value={device.id}>
            {device.name} ({device.state})
          </option>
        ))}
      </select>

      <button
        className="preview-action-btn"
        onClick={onRefreshDevices}
        title="Refresh device list"
      >
        <RefreshCw size={14} />
      </button>

      {selectedDeviceId && (
        <button
          className={`simulator-action-btn ${isStreaming ? 'simulator-action-btn-active' : ''}`}
          onClick={handleAction}
        >
          <Power size={14} />
          {isStreaming ? 'Stop' : selectedDevice?.state === 'booted' ? 'Stream' : 'Boot'}
        </button>
      )}

      {/* Status indicator */}
      <div className="simulator-status">
        <div className={`simulator-status-dot simulator-status-${simulatorStatus}`} />
        <span className="simulator-status-text">{simulatorStatus}</span>
      </div>
    </div>
  );
}
