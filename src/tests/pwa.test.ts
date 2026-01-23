import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Configuration', () => {
  const publicDir = path.join(process.cwd(), 'public');

  it('should have a manifest.json file', () => {
    const manifestPath = path.join(publicDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe('Absen Sholat');
    expect(manifest.short_name).toBe('AbsenSholat');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#ffffff');
    expect(manifest.theme_color).toBe('#16a34a');
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have a service worker file', () => {
    const swPath = path.join(publicDir, 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('self.addEventListener("install"');
    expect(swContent).toContain('self.addEventListener("fetch"');
  });
});
