// src/lib/logger.ts
const LOG_URL = '/api/core/log/';  // ← URL correta do core

export async function logError(error: any, context: string) {
  try {
    const logData = {
      level: 'ERROR' as const,
      message: error.message || String(error),
      stack: error.stack,
      url: window.location.pathname,
      context,
      timestamp: new Date().toISOString()
    };
    
    await fetch(LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (logError) {
    // fallback silencioso
  }
}
