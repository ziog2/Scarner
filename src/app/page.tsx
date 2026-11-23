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
              <p className="hero-eyebrow">100% Free · Zero Fake Estimates</p>
              <h1 className="hero-title">
                Real European vehicle data by license plate or VIN, for free.
              </h1>
              <p className="hero-subtitle">
                Scarner queries open European government APIs directly (Netherlands RDW Open Data,
                ISO 3779 VIN decoding, NHTSA vPIC &amp; Recalls, plus plug-and-play free government
                APIs for UK DVSA/DVLA, Norway Statens Vegvesen, and Czech RSV) — and routes every
                other European country to its official free public portals without ever inventing
                fake mileage.
              </p>

              <ul className="hero-points">
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Live keyless APIs out of the box</strong>: Netherlands RDW (cars &amp;
                    motorcycles) + global 17-char VIN &amp; safety recalls
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Free Gov API connectors ready</strong>: UK DVSA MOT real mileage, Norway
                    Vegvesen, and Czech RSV via <code>.env.local</code>
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>20 European countries mapped</strong> to verified free official portals
                    (IT, PL, FR, DK, SE, EE, LV, LT, ES, DE, BE, HU, SK, RO, FI, IE)
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Honest by design</strong>: missing fields are marked unavailable instead
                    of showing fabricated mileage or prices
                  </span>
                </li>
              </ul>
            </div>

            <PlateSearchCard />
          </div>
        </section>

        <section className="section-block" id="coverage">
          <div className="container">
            <h2 className="section-heading">European Free Data Architecture</h2>
            <p className="section-lead">
              Different European countries expose vehicle registries differently. Scarner combines
              every legal, free data source into one unified interface.
            </p>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-step">TIER 1 · KEYLESS LIVE APIS</div>
                <h3>RDW (NL) + VIN + Safety Recalls</h3>
                <p>
                  Instant real-time queries against 5 Netherlands RDW Open Data datasets (cars &amp;
                  motorcycles), ISO 3779 WMI decoding, NHTSA vPIC factory specs, and recall feeds
                  with zero API keys.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">TIER 1 · FREE GOV API KEYS</div>
                <h3>UK MOT, Norway &amp; Czechia</h3>
                <p>
                  Drop free official government API keys into <code>.env.local</code> to unlock live
                  UK DVSA MOT mileage &amp; rollback detection, Norway Statens Vegvesen, and Czech
                  RSV technical lookups.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">TIER 2 · FREE EU PORTALS</div>
                <h3>1-Click Official Verification</h3>
                <p>
                  For countries whose free registries require web CAPTCHAs or eID (Italy MIT/Police,
                  Poland Historia Pojazdu, Denmark, Estonia, Sweden, France HistoVec), Scarner
                  provides instant country-matched links.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div>
            <strong>Scarner</strong> — Open-source European vehicle lookup (Plate &amp; VIN).
          </div>
          <div>Zero paywalls · Zero fabricated estimates · Full source audit trail</div>
        </div>
      </footer>
    </>
  );
}
