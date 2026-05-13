export interface HairlineProps {
  width?: number | string;
  color?: string;
  margin?: string;
}

export function Hairline({
  width = 56,
  color = 'var(--color-champagne)',
  margin = '16px 0',
}: HairlineProps) {
  return <div style={{ width, height: 1, background: color, margin }} />;
}
