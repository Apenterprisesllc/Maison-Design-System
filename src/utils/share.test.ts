import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { share } from './share';

interface NavigatorMock {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (s: string) => Promise<void> };
}

describe('share', () => {
  const originalNavigator = globalThis.navigator;
  let navigatorMock: NavigatorMock;

  beforeEach(() => {
    navigatorMock = {};
    Object.defineProperty(globalThis, 'navigator', {
      value: navigatorMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('returns kind=shared when the native share resolves', async () => {
    navigatorMock.share = vi.fn().mockResolvedValue(undefined);
    const result = await share({ title: 't', text: 'x', url: 'https://example.com' });
    expect(result).toEqual({ kind: 'shared' });
    expect(navigatorMock.share).toHaveBeenCalledOnce();
  });

  it('returns kind=cancelled when the user dismisses the share sheet', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    navigatorMock.share = vi.fn().mockRejectedValue(abort);
    const result = await share({ url: 'https://example.com' });
    expect(result).toEqual({ kind: 'cancelled' });
  });

  it('falls back to clipboard when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    navigatorMock.clipboard = { writeText };
    const result = await share({ title: 'A', text: 'B', url: 'https://example.com' });
    expect(result).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith('A — B — https://example.com');
  });

  it('returns kind=unsupported when no API is available', async () => {
    const result = await share({ title: 'A' });
    expect(result).toEqual({ kind: 'unsupported' });
  });
});
