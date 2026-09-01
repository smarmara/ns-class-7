import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Card({
  children,
  title,
  action,
  className,
  id,
}: {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Anchor target, for in-page navigation between sections. */
  id?: string;
}) {
  return (
    <section id={id} className={className ? `card ${className}` : 'card'}>
      {(title || action) && (
        <div className="card-title">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Meter({
  label,
  value,
  max = 1,
  display,
}: {
  label: string;
  value: number;
  max?: number;
  display?: string;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="meter-value">{display ?? `${pct}%`}</span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={display ?? `${pct} percent`}
      >
        <div className="meter-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

export function Banner({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: 'neutral' | 'info' | 'warn';
  icon?: string;
  children: ReactNode;
}) {
  return (
    <div className="banner" data-tone={tone}>
      {icon && (
        <span className="banner-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

export function Tile({
  to,
  onClick,
  emoji,
  title,
  sub,
  accuracy,
  band,
}: {
  to?: string;
  onClick?: () => void;
  emoji?: string;
  title: string;
  sub?: string;
  accuracy?: string;
  band?: 'weak' | 'strong' | 'neutral';
}) {
  const inner = (
    <>
      {emoji && (
        <span className="tile-emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="tile-body">
        <span className="tile-title">{title}</span>
        {sub && <span className="tile-sub">{sub}</span>}
      </span>
      {accuracy && (
        <span className="tile-accuracy" data-band={band ?? 'neutral'}>
          {accuracy}
        </span>
      )}
      <span className="tile-chevron" aria-hidden="true">
        ›
      </span>
    </>
  );

  if (to) {
    return (
      <li>
        <Link className="tile" to={to}>
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button type="button" className="tile" onClick={onClick}>
        {inner}
      </button>
    </li>
  );
}

export function EmptyState({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-emoji" aria-hidden="true">
        {emoji}
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}

export function Disclaimer() {
  return (
    <p className="disclaimer">
      Independent, unofficial study aid. Not affiliated with or endorsed by the Government of Nova
      Scotia, Access Nova Scotia or the Registry of Motor Vehicles.{' '}
      <Link to="/sources">Sources and about</Link>
    </p>
  );
}
