import { loadRuntimeConfig } from './runtime-config';

describe('Application startup configuration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads uncached deployment settings before startup', async () => {
    const fetchConfig = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      apiBaseUrl: 'https://vacate.azurewebsites.net/api', revision: 'release',
    })));
    vi.stubGlobal('fetch', fetchConfig);
    expect(await loadRuntimeConfig()).toEqual({ apiBaseUrl: 'https://vacate.azurewebsites.net/api', revision: 'release' });
    expect(fetchConfig).toHaveBeenCalledWith('/config.json', { cache: 'no-store' });
  });

  it('fails startup when deployment configuration is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(loadRuntimeConfig()).rejects.toThrow('Application configuration unavailable');
  });
});
