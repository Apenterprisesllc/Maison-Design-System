import { useCountUp } from '../hooks/useCountUp';

export interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  /** Formatter, e.g. `(n) => Math.round(n).toLocaleString()` */
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ to, from = 0, duration = 1.6, format, className, style }: CountUpProps) {
  const ref = useCountUp<HTMLSpanElement>({ to, from, duration, format });
  return (
    <span ref={ref} className={className} style={style}>
      {format ? format(from) : Math.round(from).toLocaleString()}
    </span>
  );
}
