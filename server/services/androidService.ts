/**
 * Android Emulator Service
 * Detects devices, captures screenshots, forwards events via ADB
 */

import type { ServerWebSocket } from 'bun';

export interface AndroidDevice {
  id: string;
  name: string;
  platform: 'android';
  state: 'booted' | 'shutdown';
}

let captureInterval: ReturnType<typeof setInterval> | null = null;
const activeClients = new Set<ServerWebSocket<unknown>>();

/**
 * Check if ADB is available
 */
export function isAdbAvailable(): boolean {
  try {
    const proc = Bun.spawnSync(['which', 'adb']);
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Check if scrcpy is available
 */
export function isScrcpyAvailable(): boolean {
  try {
    const proc = Bun.spawnSync(['which', 'scrcpy']);
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * List connected Android devices and emulators
 */
export async function listAndroidDevices(): Promise<AndroidDevice[]> {
  if (!isAdbAvailable()) return [];

  try {
    const proc = Bun.spawnSync(['adb', 'devices', '-l']);
    if (proc.exitCode !== 0) return [];

    const output = proc.stdout.toString();
    const lines = output.split('\n').slice(1); // Skip header
    const devices: AndroidDevice[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;

      const id = parts[0];
      const stateStr = parts[1];

      // Extract model name from properties
      const modelMatch = trimmed.match(/model:(\S+)/);
      const name = modelMatch ? modelMatch[1].replace(/_/g, ' ') : id;

      // Map to UI-expected states: 'device' → 'booted', everything else → 'shutdown'
      const state: 'booted' | 'shutdown' = stateStr === 'device' ? 'booted' : 'shutdown';

      devices.push({ id, name, platform: 'android', state });
    }

    return devices;
  } catch {
    return [];
  }
}

/**
 * Capture a screenshot from an Android device via ADB
 */
export async function captureScreenshot(deviceId: string): Promise<Buffer | null> {
  try {
    const proc = Bun.spawnSync(['adb', '-s', deviceId, 'exec-out', 'screencap', '-p']);
    if (proc.exitCode !== 0) return null;

    return Buffer.from(proc.stdout);
  } catch {
    return null;
  }
}

/**
 * Send tap event to Android device
 */
export function sendTap(deviceId: string, x: number, y: number): void {
  try {
    Bun.spawnSync(['adb', '-s', deviceId, 'shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y))]);
  } catch {
    // Ignore tap errors
  }
}

/**
 * Send swipe event to Android device
 */
export function sendSwipe(deviceId: string, x1: number, y1: number, x2: number, y2: number, duration: number = 300): void {
  try {
    Bun.spawnSync([
      'adb', '-s', deviceId, 'shell', 'input', 'swipe',
      String(Math.round(x1)), String(Math.round(y1)),
      String(Math.round(x2)), String(Math.round(y2)),
      String(Math.round(duration)),
    ]);
  } catch {
    // Ignore swipe errors
  }
}

/**
 * Start capture loop — sends PNG frames to all connected WebSocket clients
 * Android screenshots are slower than iOS, so use ~5fps (200ms interval)
 */
export function startCaptureLoop(deviceId: string): void {
  if (captureInterval) {
    clearInterval(captureInterval);
  }

  captureInterval = setInterval(async () => {
    if (activeClients.size === 0) return;

    const screenshot = await captureScreenshot(deviceId);
    if (!screenshot) return;

    for (const client of activeClients) {
      try {
        client.send(screenshot);
      } catch {
        activeClients.delete(client);
      }
    }
  }, 200);
}

/**
 * Stop capture loop
 */
export function stopCaptureLoop(): void {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

/**
 * Register a WebSocket client for Android frames
 */
export function addClient(ws: ServerWebSocket<unknown>): void {
  activeClients.add(ws);
}

/**
 * Remove a WebSocket client
 */
export function removeClient(ws: ServerWebSocket<unknown>): void {
  activeClients.delete(ws);
  if (activeClients.size === 0) {
    stopCaptureLoop();
  }
}
