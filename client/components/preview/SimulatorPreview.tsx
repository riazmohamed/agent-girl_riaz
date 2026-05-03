import { useEffect, useRef, useCallback } from 'react';
import { usePreviewStore } from '../../stores/previewStore';
import { useSimulatorStream } from '../../hooks/useSimulatorStream';
import { SimulatorControls } from './SimulatorControls';
import { Monitor } from 'lucide-react';

export function SimulatorPreview() {
  const { simulatorStatus, selectedDeviceId } = usePreviewStore();
  const {
    canvasRef,
    isConnected,
    connect,
    startStreaming,
    stopStreaming,
    requestDeviceList,
    bootDevice,
    sendTap,
    sendSwipe,
  } = useSimulatorStream();

  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    sendTap(x, y);
  }, [canvasRef, sendTap]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    swipeStartRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  }, [canvasRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!swipeStartRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dx = endX - swipeStartRef.current.x;
    const dy = endY - swipeStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only treat as swipe if moved more than 20px
    if (distance > 20) {
      const duration = Date.now() - swipeStartRef.current.time;
      sendSwipe(swipeStartRef.current.x, swipeStartRef.current.y, endX, endY, Math.max(duration, 100));
    }

    swipeStartRef.current = null;
  }, [canvasRef, sendSwipe]);

  return (
    <div className="simulator-preview">
      <SimulatorControls
        onBootDevice={bootDevice}
        onStartStreaming={startStreaming}
        onStopStreaming={stopStreaming}
        onRefreshDevices={requestDeviceList}
      />

      <div className="simulator-canvas-wrapper">
        {simulatorStatus === 'streaming' ? (
          <canvas
            ref={canvasRef}
            className="simulator-canvas"
            onClick={handleCanvasClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          />
        ) : (
          <div className="preview-empty-state">
            <Monitor size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
            <h3 className="preview-empty-title">
              {!isConnected
                ? 'Connecting...'
                : !selectedDeviceId
                  ? 'Select a Device'
                  : 'Ready to Stream'}
            </h3>
            <p className="preview-empty-description">
              {!isConnected
                ? 'Connecting to simulator service...'
                : !selectedDeviceId
                  ? 'Choose a simulator or device from the dropdown above'
                  : 'Click Stream to start viewing the simulator screen'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
