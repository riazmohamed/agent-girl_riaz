import { useEffect, useRef, useCallback, useState } from 'react';
import { usePreviewStore } from '../stores/previewStore';
import type { SimulatorDevice } from '../stores/previewStore';

export function useSimulatorStream() {
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { setSimulatorStatus, setSimulatorDevices, selectedDeviceId } = usePreviewStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/simulator`);

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsConnected(true);
      setSimulatorStatus('connecting');
      // Request device list on connect
      ws.send(JSON.stringify({ type: 'list_devices' }));
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary frame - PNG screenshot
        renderFrame(event.data);
        return;
      }

      // JSON message
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'device_list') {
          setSimulatorDevices(data.devices as SimulatorDevice[]);
        } else if (data.type === 'streaming_started') {
          setSimulatorStatus('streaming');
        } else if (data.type === 'streaming_stopped') {
          setSimulatorStatus('disconnected');
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSimulatorStatus('disconnected');
      wsRef.current = null;
    };

    ws.onerror = () => {
      setSimulatorStatus('disconnected');
    };

    wsRef.current = ws;
  }, [setSimulatorStatus, setSimulatorDevices]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const renderFrame = useCallback((data: ArrayBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blob = new Blob([data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, []);

  const startStreaming = useCallback((deviceId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_streaming', deviceId }));
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_streaming' }));
    }
  }, []);

  const requestDeviceList = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'list_devices' }));
    }
  }, []);

  const bootDevice = useCallback((deviceId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'boot_device', deviceId }));
    }
  }, []);

  const sendTap = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedDeviceId) {
      wsRef.current.send(JSON.stringify({ type: 'tap', deviceId: selectedDeviceId, x, y }));
    }
  }, [selectedDeviceId]);

  const sendSwipe = useCallback((x1: number, y1: number, x2: number, y2: number, duration: number = 300) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedDeviceId) {
      wsRef.current.send(JSON.stringify({ type: 'swipe', deviceId: selectedDeviceId, x1, y1, x2, y2, duration }));
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    canvasRef,
    isConnected,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    requestDeviceList,
    bootDevice,
    sendTap,
    sendSwipe,
  };
}
