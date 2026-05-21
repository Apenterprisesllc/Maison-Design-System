import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageTransition } from './PageTransition';

function Wrapped({ keyName, children }: { keyName: string; children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <PageTransition transitionKey={keyName}>{children}</PageTransition>
    </MemoryRouter>
  );
}

describe('PageTransition', () => {
  it('starts visible and interactive on first mount', () => {
    const { container } = render(
      <Wrapped keyName="initial">
        <div data-testid="content">hello</div>
      </Wrapped>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('1');
    expect(wrapper.style.pointerEvents).toBe('auto');
  });

  it('disables pointer-events during the fade-out phase to drop stale clicks', () => {
    const { container, rerender } = render(
      <Wrapped keyName="a">
        <div>A</div>
      </Wrapped>,
    );
    rerender(
      <Wrapped keyName="b">
        <div>B</div>
      </Wrapped>,
    );
    const wrapper = container.firstChild as HTMLElement;
    // After the key changes the wrapper enters phase='out' until FADE_MS.
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.style.pointerEvents).toBe('none');
  });
});
