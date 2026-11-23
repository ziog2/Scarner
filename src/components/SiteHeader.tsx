import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand-link" aria-label="Scarner Home">
          <span className="brand-mark" aria-hidden="true">
            SC
          </span>
          <span>Scarner</span>
          <span className="brand-tag">Free</span>
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/report/GG482KL">Car Sample</Link>
          <Link href="/report/FR719MN">Rollback Sample</Link>
          <Link href="/report/FE39281">Motorcycle Sample</Link>
        </nav>
      </div>
    </header>
  );
}
