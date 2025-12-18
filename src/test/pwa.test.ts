import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PWA Configuration', () => {
  describe('manifest.json', () => {
    const manifestPath = resolve(__dirname, '../../public/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

    it('should have required name fields', () => {
      expect(manifest.name).toBe('Open Ham Prep');
      expect(manifest.short_name).toBe('Ham Prep');
    });

    it('should have a description', () => {
      expect(manifest.description).toBeTruthy();
      expect(manifest.description.length).toBeGreaterThan(10);
    });

    it('should have correct display mode', () => {
      expect(manifest.display).toBe('standalone');
    });

    it('should have start_url set to root', () => {
      expect(manifest.start_url).toBe('/');
    });

    it('should have theme and background colors', () => {
      expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have icons with required sizes', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);

      const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('384x384');
      expect(sizes).toContain('512x512');
    });

    it('should have maskable icons for adaptive icon support', () => {
      const maskableIcons = manifest.icons.filter(
        (icon: { purpose?: string }) => icon.purpose === 'maskable'
      );
      expect(maskableIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should have valid icon paths', () => {
      manifest.icons.forEach((icon: { src: string; type: string }) => {
        expect(icon.src).toMatch(/^\/icons\/icon.*\.png$/);
        expect(icon.type).toBe('image/png');
      });
    });

    it('should not lock orientation (allow any)', () => {
      expect(manifest.orientation).toBe('any');
    });

    it('should have scope set to root', () => {
      expect(manifest.scope).toBe('/');
    });
  });

  describe('index.html PWA meta tags', () => {
    const indexPath = resolve(__dirname, '../../index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');

    it('should link to manifest.json', () => {
      expect(indexHtml).toContain('rel="manifest"');
      expect(indexHtml).toContain('href="/manifest.json"');
    });

    it('should have theme-color meta tags', () => {
      expect(indexHtml).toContain('name="theme-color"');
    });

    it('should have mobile-web-app-capable meta tag', () => {
      expect(indexHtml).toContain('name="mobile-web-app-capable"');
    });

    it('should have apple-mobile-web-app meta tags', () => {
      expect(indexHtml).toContain('name="apple-mobile-web-app-capable"');
      expect(indexHtml).toContain('name="apple-mobile-web-app-status-bar-style"');
      expect(indexHtml).toContain('name="apple-mobile-web-app-title"');
    });

    it('should have apple-touch-icon link', () => {
      expect(indexHtml).toContain('rel="apple-touch-icon"');
      expect(indexHtml).toContain('href="/apple-touch-icon.png"');
    });

    it('should have viewport-fit=cover for notched devices', () => {
      expect(indexHtml).toContain('viewport-fit=cover');
    });
  });

  describe('PWA icon files', () => {
    const iconsDir = resolve(__dirname, '../../public/icons');

    it('should have 192x192 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-192.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have 384x384 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-384.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have 512x512 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-512.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have maskable 192x192 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-maskable-192.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have maskable 384x384 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-maskable-384.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have maskable 512x512 icon', () => {
      const iconPath = resolve(iconsDir, 'icon-maskable-512.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });

    it('should have apple-touch-icon', () => {
      const iconPath = resolve(__dirname, '../../public/apple-touch-icon.png');
      expect(() => readFileSync(iconPath)).not.toThrow();
    });
  });

  describe('Service Worker', () => {
    const swPath = resolve(__dirname, '../../public/sw.js');
    const swContent = readFileSync(swPath, 'utf-8');

    it('should exist in public directory', () => {
      expect(() => readFileSync(swPath)).not.toThrow();
    });

    it('should have install event listener', () => {
      expect(swContent).toContain("addEventListener('install'");
    });

    it('should have fetch event listener', () => {
      expect(swContent).toContain("addEventListener('fetch'");
    });

    it('should have activate event listener for cache cleanup', () => {
      expect(swContent).toContain("addEventListener('activate'");
    });

    it('should cache static assets', () => {
      expect(swContent).toContain('caches.open');
      expect(swContent).toContain('/manifest.json');
    });

    it('should skip API requests from caching', () => {
      expect(swContent).toContain('API_PATTERNS');
      expect(swContent).toContain('shouldSkipCaching');
      expect(swContent).toContain('supabase');
    });

    it('should pre-cache 384px icon', () => {
      expect(swContent).toContain('/icons/icon-384.png');
    });
  });

  describe('Service Worker Registration', () => {
    const mainPath = resolve(__dirname, '../main.tsx');
    const mainContent = readFileSync(mainPath, 'utf-8');

    it('should register service worker in main.tsx', () => {
      expect(mainContent).toContain('serviceWorker');
      expect(mainContent).toContain("register('/sw.js')");
    });

    it('should check for service worker support before registering', () => {
      expect(mainContent).toContain("'serviceWorker' in navigator");
    });

    it('should listen for service worker updates', () => {
      expect(mainContent).toContain('updatefound');
    });

    it('should periodically check for updates', () => {
      expect(mainContent).toContain('registration.update()');
    });
  });
});
