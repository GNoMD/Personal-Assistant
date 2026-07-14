import AppNav from './AppNav';

/**
 * Shared page chrome so tab switches keep the nav bar and header controls aligned.
 */
export default function AppShell({
  kicker = '',
  title,
  subtitle = null,
  actions = null,
  className = '',
  children,
  footer = null,
}) {
  return (
    <div className={`app${className ? ` ${className}` : ''}`}>
      <div className="app-chrome">
        <AppNav />
        <header className="app-header">
          <div className="header-brand">
            <p className={`page-kicker${kicker ? '' : ' is-empty'}`} aria-hidden={!kicker || undefined}>
              {kicker || '\u00A0'}
            </p>
            <h1>{title}</h1>
            {subtitle ? <p className="subtitle">{subtitle}</p> : <p className="subtitle is-empty" aria-hidden="true">&nbsp;</p>}
          </div>
          <div className="header-actions">{actions}</div>
        </header>
      </div>
      {children}
      {footer}
    </div>
  );
}
