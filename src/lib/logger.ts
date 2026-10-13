// src/lib/logger.ts
const LOG_URL = '/api/core/log/';  // ← URL correta do core

export async function logError(error: unknown, context: string) {
  try {
    const normalizedError = error instanceof Error ? error : null;
    const logData = {
      level: 'ERROR' as const,
      message: normalizedError?.message ?? String(error),
      stack: normalizedError?.stack,
      url: window.location.pathname,
      context,
      timestamp: new Date().toISOString()
    };
    
    await fetch(LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch {
    // fallback silencioso
  }
}
