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
          <span className="brand-tag">Gratuito</span>
        </Link>

        <nav className="header-nav" aria-label="Navigazione principale">
          <Link href="/#come-funziona">Come funziona</Link>
          <Link href="/report/GG482KL">Report esempio auto</Link>
          <Link href="/report/FR719MN">Esempio km scalati</Link>
          <Link href="/report/FE39281">Report esempio moto</Link>
        </nav>
      </div>
    </header>
  );
}
