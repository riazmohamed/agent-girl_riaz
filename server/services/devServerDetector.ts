/**
 * Dev Server Detector
 * Parses process stdout for common dev server URL patterns
 */

export interface DetectedServer {
  type: 'web' | 'expo';
  url: string;
}

// Patterns that indicate a web dev server URL
const WEB_SERVER_PATTERNS = [
  // Generic localhost URL with port
  /https?:\/\/localhost:\d{4,5}/,
  // Vite / Next.js / CRA / Angular format: "Local: http://localhost:3000"
  /Local:\s+(https?:\/\/localhost:\d{4,5})/,
  // Express / Fastify / Koa: "listening on http://localhost:3000"
  /listening on\s+(https?:\/\/localhost:\d{4,5})/,
  // Next.js: "ready on http://localhost:3000"
  /ready on\s+(https?:\/\/localhost:\d{4,5})/,
  // Vite: "➜ Local: http://localhost:5173/"
  /➜\s+Local:\s+(https?:\/\/localhost:\d{4,5})/,
  // Generic server started
  /server (?:started|running) (?:at|on)\s+(https?:\/\/localhost:\d{4,5})/i,
  // 127.0.0.1 variant
  /https?:\/\/127\.0\.0\.1:\d{4,5}/,
];

// Patterns that indicate an Expo dev server
const EXPO_PATTERNS = [
  // Expo Go URL
  /exp:\/\/\S+/,
  // Metro bundler URL
  /Metro waiting on (exp:\/\/\S+)/,
];

/**
 * Parse a chunk of stdout text for dev server URLs
 */
export function detectDevServer(text: string): DetectedServer | null {
  // Check Expo patterns first (more specific)
  for (const pattern of EXPO_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Use the captured group if present, otherwise the full match
      const url = match[1] || match[0];
      return { type: 'expo', url: url.trim() };
    }
  }

  // Check web server patterns
  for (const pattern of WEB_SERVER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Use the captured group if present, otherwise the full match
      const url = match[1] || match[0];
      // Clean up trailing slashes and whitespace
      return { type: 'web', url: url.replace(/\/+$/, '').trim() };
    }
  }

  return null;
}

/**
 * Extract all dev server URLs from a block of text
 */
export function detectAllDevServers(text: string): DetectedServer[] {
  const results: DetectedServer[] = [];
  const seenUrls = new Set<string>();

  const lines = text.split('\n');
  for (const line of lines) {
    const detected = detectDevServer(line);
    if (detected && !seenUrls.has(detected.url)) {
      seenUrls.add(detected.url);
      results.push(detected);
    }
  }

  return results;
}
