import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest keeps Node globals that already exist; browser tests need jsdom storage.
const browserWindow = (globalThis as typeof globalThis & {
  jsdom: { window: Window };
}).jsdom.window;
Object.defineProperties(globalThis, {
  localStorage: { configurable: true, value: browserWindow.localStorage },
  sessionStorage: { configurable: true, value: browserWindow.sessionStorage },
});

// jsdom thiếu Element.scrollIntoView (React dùng trong effect) — polyfill no-op
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Dọn DOM giữa các test để tránh interference giữa các file test
afterEach(() => {
  cleanup();
});
