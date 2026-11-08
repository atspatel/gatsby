export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="16" fill="#3d7a52" />
      <path d="M6 22.5V14.2L16 6.5l10 7.7v8.3" fill="none" stroke="#f6f1e8" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12.2 22.5v-5.2a3.8 3.8 0 0 1 7.6 0v5.2" fill="none" stroke="#f3d7b0" strokeWidth="1.6" />
    </svg>
  )
}

export function Brand({ company }) {
  return (
    <a className="brand" href="#homes">
      <BrandMark />
      <span>
        <strong>{company.name}</strong>
        <small>Homes</small>
      </span>
    </a>
  )
}

export function SiteHeader({ company, back = false, current }) {
  return (
    <header className="site-header">
      {back ? (
        <a className="back-link" href="#homes">
          <span aria-hidden="true">←</span>
          All homes
        </a>
      ) : (
        <Brand company={company} />
      )}
      <div className="header-side">
        <a className="header-link" href="#about" aria-current={current === 'about' ? 'page' : undefined}>
          About
        </a>
        {back && <Brand company={company} />}
      </div>
    </header>
  )
}

export function SiteFooter({ company, children }) {
  return (
    <footer className="site-footer">
      <a className="brand" href="#homes">
        <BrandMark />
        <span>
          <strong>{company.name}</strong>
          <small>{company.tagline}</small>
        </span>
      </a>
      <nav aria-label="Site">
        <a href="#homes">Homes</a>
        <a href="#about">About</a>
        {children}
      </nav>
    </footer>
  )
}
