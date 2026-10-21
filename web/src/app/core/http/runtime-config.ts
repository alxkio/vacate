import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  apiBaseUrl: string;
  revision: string;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RuntimeConfig');

export function parseRuntimeConfig(value: unknown): RuntimeConfig {
  const config = value as Partial<RuntimeConfig> | null;
  if (!config || typeof config.apiBaseUrl !== 'string' || typeof config.revision !== 'string') {
    throw new Error('Invalid application configuration');
  }
  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '');
  // Local development uses the Angular proxy. Cloud configuration uses HTTPS.
  if (apiBaseUrl !== '/api') {
    const url = new URL(apiBaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api') {
      throw new Error('Invalid API URL');
    }
  }
  return { apiBaseUrl, revision: config.revision };
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Application configuration unavailable');
  return parseRuntimeConfig(await response.json());
}
