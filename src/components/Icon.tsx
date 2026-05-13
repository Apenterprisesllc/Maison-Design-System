import type { CSSProperties } from 'react';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

/**
 * Lucide icon stub.
 *
 * The `<i data-lucide>` element is wrapped in a `<span>` rendered via
 * `dangerouslySetInnerHTML`. This keeps the `<i>` out of React's reconciler
 * — Lucide's `createIcons()` is free to replace it with an `<svg>` element
 * without React later trying (and failing) to `removeChild` an `<i>` that no
 * longer exists.
 *
 * Without this isolation, navigation between routes throws
 * `NotFoundError: Failed to execute 'removeChild' on 'Node'`.
 */
export function Icon({ name, size = 20, color = 'currentColor', style }: IconProps) {
  const html = `<i data-lucide="${name}" width="${size}" height="${size}" style="stroke-width:1.5;width:${size}px;height:${size}px;color:currentColor;display:inline-block;"></i>`;

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        lineHeight: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
