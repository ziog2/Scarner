import { PlateSearchCard } from '@/components/PlateSearchCard';
import { SiteHeader } from '@/components/SiteHeader';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <p className="hero-eyebrow">Free &amp; open-source alternative</p>
              <h1 className="hero-title">
                Check car and motorcycle history by license plate, for free.
              </h1>
              <p className="hero-subtitle">
                Scarner is built as a transparent, zero-cost alternative to paid vehicle report
                platforms: real plate format validation and registration year estimation, odometer
                rollback charts, car &amp; motorcycle damage blueprints, and direct links to
                official public verification portals.
              </p>

              <ul className="hero-points">
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Cars, motorcycles &amp; 50cc mopeds</strong> with automatic plate format
                    detection
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Odometer rollback detection</strong> with chronological inspection chart
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Car &amp; motorcycle damage blueprints</strong>, technical specs, CO₂
                    and road tax
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>One-Page PDF export</strong> and 1-click access to free official public
                    registries
                  </span>
                </li>
              </ul>
            </div>

            <PlateSearchCard />
          </div>
        </section>

        <section className="section-block" id="how-it-works">
          <div className="container">
            <h2 className="section-heading">Project roadmap: from manual plate to photo scan</h2>
            <p className="section-lead">
              Scarner is engineered modularly so it is useful from day one and straightforward to
              extend with live open-data connectors and automated license plate OCR.
            </p>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-step">PHASE 1 · LIVE</div>
                <h3>Manual Plate Lookup (Cars &amp; Motorcycles)</h3>
                <p>
                  Real Italian license plate validation for cars, motorcycles, and 50cc mopeds,
                  chronological registration year estimation, and printable PDF reports.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">PHASE 2 · NEXT</div>
                <h3>Photo &amp; Screenshot OCR Scanning</h3>
                <p>
                  Upload a street photo or paste a listing screenshot: an OCR/ALPR pipeline extracts
                  the license plate automatically while resolving character/digit ambiguities.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">OPEN ARCHITECTURE</div>
                <h3>Modular &amp; Transparent Data Providers</h3>
                <p>
                  Every section clearly discloses data provenance. Alongside extensible API
                  connectors, Scarner links directly to free official public checks without paywalls.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div>
            <strong>Scarner</strong> — Open-source free vehicle history reports.
          </div>
          <div>No subscriptions · No paywalls · Transparent data sources</div>
        </div>
      </footer>
    </>
  );
}
