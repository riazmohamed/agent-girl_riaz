/**
 * Unified Simulator Service
 * Detects, captures, and forwards events to iOS Simulator and Android Emulator
 */

import type { ServerWebSocket } from 'bun';
import * as android from './androidService';

interface SimulatorDevice {
  id: string;
  name: string;
  platform: 'ios';
  state: 'booted' | 'shutdown';
}

type AnyDevice = SimulatorDevice | android.AndroidDevice;

/** Maps deviceId → platform for routing commands to the correct service */
const devicePlatformMap = new Map<string, 'ios' | 'android'>();

/** Track which platform is currently streaming */
let activeStreamingPlatform: 'ios' | 'android' | null = null;

interface SimctlDevice {
  name: string;
  udid: string;
  state: string;
  isAvailable: boolean;
}

let captureInterval: ReturnType<typeof setInterval> | null = null;
const activeClients = new Set<ServerWebSocket<unknown>>();

/**
 * List available iOS Simulator devices
 */
export async function listSimulatorDevices(): Promise<SimulatorDevice[]> {
  try {
    const proc = Bun.spawnSync(['xcrun', 'simctl', 'list', 'devices', '--json']);
    if (proc.exitCode !== 0) return [];

    const output = proc.stdout.toString();
    const data = JSON.parse(output);
    const devices: SimulatorDevice[] = [];

    for (const [, deviceList] of Object.entries(data.devices)) {
      for (const device of deviceList as SimctlDevice[]) {
        if (device.isAvailable) {
          devices.push({
            id: device.udid,
            name: device.name,
            platform: 'ios',
            state: device.state === 'Booted' ? 'booted' : 'shutdown',
          });
        }
      }
    }

    return devices;
  } catch {
    return [];
  }
}

/**
 * Boot a simulator device
 */
export async function bootDevice(deviceId: string): Promise<boolean> {
  try {
    const proc = Bun.spawnSync(['xcrun', 'simctl', 'boot', deviceId]);
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Capture a single screenshot from the booted simulator
 */
async function captureScreenshot(deviceId: string): Promise<Buffer | null> {
  try {
    const tmpFile = `/tmp/agent-girl-sim-${deviceId}.png`;
    const proc = Bun.spawnSync(['xcrun', 'simctl', 'io', deviceId, 'screenshot', '--type=png', tmpFile]);
    if (proc.exitCode !== 0) return null;

    const file = Bun.file(tmpFile);
    const exists = await file.exists();
    if (!exists) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    return buffer;
  } catch {
    return null;
  }
}

/**
 * Start capture loop - sends PNG frames to all connected WebSocket clients
 */
export function startCaptureLoop(deviceId: string): void {
  if (captureInterval) {
    clearInterval(captureInterval);
  }

  // Target ~10 fps (100ms interval)
  captureInterval = setInterval(async () => {
    if (activeClients.size === 0) return;

    const screenshot = await captureScreenshot(deviceId);
    if (!screenshot) return;

    // Send binary frame to all connected clients
    for (const client of activeClients) {
      try {
        client.send(screenshot);
      } catch {
        activeClients.delete(client);
      }
    }
  }, 100);
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
 * Forward tap event to simulator
 */
export function sendTap(deviceId: string, x: number, y: number): void {
  try {
    Bun.spawnSync(['xcrun', 'simctl', 'io', deviceId, 'tap', String(Math.round(x)), String(Math.round(y))]);
  } catch {
    // Ignore tap errors
  }
}

/**
 * Forward swipe event to simulator
 */
export function sendSwipe(deviceId: string, x1: number, y1: number, x2: number, y2: number, duration: number = 300): void {
  try {
    Bun.spawnSync([
      'xcrun', 'simctl', 'io', deviceId, 'swipe',
      String(Math.round(x1)), String(Math.round(y1)),
      String(Math.round(x2)), String(Math.round(y2)),
      '--duration', String(duration / 1000),
    ]);
  } catch {
    // Ignore swipe errors
  }
}

/**
 * Register a WebSocket client for simulator frames
 */
export function addSimulatorClient(ws: ServerWebSocket<unknown>): void {
  activeClients.add(ws);
}

/**
 * Remove a WebSocket client
 */
export function removeSimulatorClient(ws: ServerWebSocket<unknown>): void {
  activeClients.delete(ws);
  if (activeClients.size === 0) {
    stopCaptureLoop();
  }
}

/**
 * Look up the platform for a device ID from the cached map
 */
function getDevicePlatform(deviceId: string): 'ios' | 'android' | null {
  return devicePlatformMap.get(deviceId) ?? null;
}

/**
 * Handle incoming simulator WebSocket messages
 * Routes commands to iOS or Android service based on device platform
 */
export async function handleSimulatorMessage(ws: ServerWebSocket<unknown>, message: string): Promise<void> {
  try {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'list_devices': {
        const [iosDevices, androidDevices] = await Promise.all([
          listSimulatorDevices(),
          android.listAndroidDevices(),
        ]);

        // Update platform map for routing
        for (const device of iosDevices) {
          devicePlatformMap.set(device.id, 'ios');
        }
        for (const device of androidDevices) {
          devicePlatformMap.set(device.id, 'android');
        }

        const devices: AnyDevice[] = [...iosDevices, ...androidDevices];
        ws.send(JSON.stringify({ type: 'device_list', devices }));
        break;
      }
      case 'start_streaming': {
        if (data.deviceId) {
          const platform = getDevicePlatform(data.deviceId);
          if (platform === 'android') {
            android.addClient(ws);
            android.startCaptureLoop(data.deviceId);
          } else {
            // Default to iOS
            addSimulatorClient(ws);
            startCaptureLoop(data.deviceId);
          }
          activeStreamingPlatform = platform ?? 'ios';
          ws.send(JSON.stringify({ type: 'streaming_started', deviceId: data.deviceId }));
        }
        break;
      }
      case 'stop_streaming': {
        if (activeStreamingPlatform === 'android') {
          android.removeClient(ws);
        } else {
          removeSimulatorClient(ws);
        }
        activeStreamingPlatform = null;
        ws.send(JSON.stringify({ type: 'streaming_stopped' }));
        break;
      }
      case 'boot_device': {
        if (data.deviceId) {
          const platform = getDevicePlatform(data.deviceId);
          if (platform === 'android') {
            // Android devices don't need booting via adb
            ws.send(JSON.stringify({ type: 'device_booted', deviceId: data.deviceId, success: true }));
          } else {
            const success = await bootDevice(data.deviceId);
            ws.send(JSON.stringify({ type: 'device_booted', deviceId: data.deviceId, success }));
          }
        }
        break;
      }
      case 'tap': {
        if (data.deviceId && typeof data.x === 'number' && typeof data.y === 'number') {
          const platform = getDevicePlatform(data.deviceId);
          if (platform === 'android') {
            android.sendTap(data.deviceId, data.x, data.y);
          } else {
            sendTap(data.deviceId, data.x, data.y);
          }
        }
        break;
      }
      case 'swipe': {
        if (data.deviceId && typeof data.x1 === 'number') {
          const platform = getDevicePlatform(data.deviceId);
          if (platform === 'android') {
            android.sendSwipe(data.deviceId, data.x1, data.y1, data.x2, data.y2, data.duration);
          } else {
            sendSwipe(data.deviceId, data.x1, data.y1, data.x2, data.y2, data.duration);
          }
        }
        break;
      }
    }
  } catch {
    // Ignore parse errors
  }
}
