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
          <span className="brand-tag">Free · Real Data</span>
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/#coverage">EU Coverage</Link>
          <Link href="/report/Z261RV?country=NL&kind=plate">Live NL Car (RDW)</Link>
          <Link href="/report/01MXSB?country=NL&kind=plate">Live NL Moto (RDW)</Link>
          <Link href="/report/5YJ3E1EA8MF000001?kind=vin">Live VIN Decode</Link>
        </nav>
      </div>
    </header>
  );
}
