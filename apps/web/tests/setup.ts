import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom thiếu Element.scrollIntoView (React dùng trong effect) — polyfill no-op
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Dọn DOM giữa các test để tránh interference giữa các file test
afterEach(() => {
  cleanup();
});
