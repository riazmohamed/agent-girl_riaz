import { create } from 'zustand';

export type PreviewMode = 'web' | 'native';
export type NativeSubMode = 'expo' | 'ios-simulator' | 'android';
export type Orientation = 'portrait' | 'landscape';

export interface ViewportPreset {
  name: string;
  label: string;
  width: number;
  height: number;
  hasFrame: boolean;
  frameType?: 'iphone-15' | 'iphone-se' | 'pixel-8' | 'ipad';
  supportsOrientation: boolean;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: 'desktop', label: 'Desktop', width: 1920, height: 1080, hasFrame: false, supportsOrientation: false },
  { name: 'laptop', label: 'Laptop', width: 1440, height: 900, hasFrame: false, supportsOrientation: false },
  { name: 'ipad', label: 'iPad', width: 820, height: 1180, hasFrame: true, frameType: 'ipad', supportsOrientation: true },
  { name: 'iphone-15', label: 'iPhone 15', width: 393, height: 852, hasFrame: true, frameType: 'iphone-15', supportsOrientation: true },
  { name: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, hasFrame: true, frameType: 'pixel-8', supportsOrientation: true },
  { name: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, hasFrame: true, frameType: 'iphone-se', supportsOrientation: true },
];

export interface SimulatorDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  state: 'booted' | 'shutdown';
}

interface PreviewState {
  // Panel state
  isPreviewOpen: boolean;
  panelWidthPercent: number;

  // Mode
  previewMode: PreviewMode;
  nativeSubMode: NativeSubMode;

  // Web preview
  previewUrl: string;
  urlHistory: string[];
  viewportPreset: string;
  orientation: Orientation;
  isLoading: boolean;
  hasError: boolean;
  refreshKey: number;

  // Native preview
  expoQrUrl: string | null;
  simulatorStatus: 'disconnected' | 'connecting' | 'streaming';
  simulatorDevices: SimulatorDevice[];
  selectedDeviceId: string | null;

  // Actions
  togglePreview: () => void;
  openPreview: () => void;
  closePreview: () => void;
  setPreviewUrl: (url: string) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setNativeSubMode: (mode: NativeSubMode) => void;
  setViewportPreset: (preset: string) => void;
  setOrientation: (orientation: Orientation) => void;
  setPanelWidth: (percent: number) => void;
  refreshPreview: () => void;
  setLoading: (loading: boolean) => void;
  setError: (hasError: boolean) => void;
  setExpoQrUrl: (url: string | null) => void;
  setSimulatorStatus: (status: 'disconnected' | 'connecting' | 'streaming') => void;
  setSimulatorDevices: (devices: SimulatorDevice[]) => void;
  setSelectedDevice: (deviceId: string | null) => void;
}

const STORAGE_PREFIX = 'agent-girl-preview-';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export const usePreviewStore = create<PreviewState>((set) => ({
  // Initial state from localStorage or defaults
  isPreviewOpen: false,
  panelWidthPercent: loadFromStorage('panelWidth', 40),
  previewMode: loadFromStorage('mode', 'web' as PreviewMode),
  nativeSubMode: loadFromStorage('nativeSubMode', 'expo' as NativeSubMode),
  previewUrl: loadFromStorage('url', ''),
  urlHistory: loadFromStorage('urlHistory', [] as string[]),
  viewportPreset: loadFromStorage('viewportPreset', 'desktop'),
  orientation: loadFromStorage('orientation', 'portrait' as Orientation),
  isLoading: false,
  hasError: false,
  refreshKey: 0,
  expoQrUrl: null,
  simulatorStatus: 'disconnected',
  simulatorDevices: [],
  selectedDeviceId: null,

  // Actions
  togglePreview: () => set((state) => {
    const next = !state.isPreviewOpen;
    return { isPreviewOpen: next };
  }),

  openPreview: () => set({ isPreviewOpen: true }),

  closePreview: () => set({ isPreviewOpen: false }),

  setPreviewUrl: (url: string) => set((state) => {
    saveToStorage('url', url);
    const history = state.urlHistory.filter(u => u !== url);
    const newHistory = [url, ...history].slice(0, 20);
    saveToStorage('urlHistory', newHistory);
    return { previewUrl: url, urlHistory: newHistory, hasError: false };
  }),

  setPreviewMode: (mode: PreviewMode) => set(() => {
    saveToStorage('mode', mode);
    return { previewMode: mode };
  }),

  setNativeSubMode: (mode: NativeSubMode) => set(() => {
    saveToStorage('nativeSubMode', mode);
    return { nativeSubMode: mode };
  }),

  setViewportPreset: (preset: string) => set(() => {
    saveToStorage('viewportPreset', preset);
    return { viewportPreset: preset };
  }),

  setOrientation: (orientation: Orientation) => set(() => {
    saveToStorage('orientation', orientation);
    return { orientation };
  }),

  setPanelWidth: (percent: number) => set(() => {
    saveToStorage('panelWidth', percent);
    return { panelWidthPercent: percent };
  }),

  refreshPreview: () => set((state) => ({
    refreshKey: state.refreshKey + 1,
    hasError: false,
    isLoading: true,
  })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (hasError: boolean) => set({ hasError }),

  setExpoQrUrl: (url: string | null) => set({ expoQrUrl: url }),

  setSimulatorStatus: (status) => set({ simulatorStatus: status }),

  setSimulatorDevices: (devices) => set({ simulatorDevices: devices }),

  setSelectedDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
}));
