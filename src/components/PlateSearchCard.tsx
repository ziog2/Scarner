'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { analyzeItalianPlate } from '@/lib/plate/italianPlate';
import { EUROPEAN_COUNTRIES } from '@/lib/providers/europeanPortals';
import { analyzeVinIso } from '@/lib/vin/iso3779';
import { EuropeanCountryCode } from '@/types/report';

type TabMode = 'plate' | 'vin' | 'photo';

const LIVE_EXAMPLES: {
  query: string;
  country?: EuropeanCountryCode;
  kind: 'plate' | 'vin';
  badge: string;
  label: string;
  tag: string;
  tone: 'ok' | 'info';
}[] = [
  {
    query: 'Z261RV',
    country: 'NL',
    kind: 'plate',
    badge: 'NL · Z261RV',
    label: 'Live RDW Car (Tesla Model 3)',
    tag: 'Live Open API',
    tone: 'ok',
  },
  {
    query: '01MXSB',
    country: 'NL',
    kind: 'plate',
    badge: 'NL · 01MXSB',
    label: 'Live RDW Motorcycle (Kawasaki)',
    tag: 'Live Open API',
    tone: 'ok',
  },
  {
    query: '09RLG6',
    country: 'NL',
    kind: 'plate',
    badge: 'NL · 09RLG6',
    label: 'Live RDW Car with APK History',
    tag: 'Live Open API',
    tone: 'ok',
  },
  {
    query: '5YJ3E1EA8MF000001',
    kind: 'vin',
    badge: 'VIN · 17ch',
    label: 'Live NHTSA vPIC + Recalls Decode',
    tag: 'Live VIN API',
    tone: 'ok',
  },
  {
    query: 'GG482KL',
    country: 'IT',
    kind: 'plate',
    badge: 'IT · GG 482 KL',
    label: 'Italy Plate Series + Official MIT Links',
    tag: 'Official Portals',
    tone: 'info',
  },
];

export function PlateSearchCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<TabMode>('plate');
  const [country, setCountry] = useState<EuropeanCountryCode>('NL');
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => EUROPEAN_COUNTRIES.find((c) => c.code === country) ?? EUROPEAN_COUNTRIES[0],
    [country]
  );

  const itAnalysis = useMemo(
    () => (tab !== 'vin' && country === 'IT' ? analyzeItalianPlate(rawInput) : null),
    [tab, country, rawInput]
  );

  const vinAnalysis = useMemo(
    () => (tab === 'vin' ? analyzeVinIso(rawInput) : null),
    [tab, rawInput]
  );

  function handleInputChange(value: string) {
    setError(null);
    setRawInput(value.toUpperCase().replace(/[^A-Z0-9\s-]/g, ''));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleaned) {
      setError(tab === 'vin' ? 'Enter a 17-character VIN.' : 'Enter a license plate number.');
      return;
    }

    if (tab === 'vin') {
      const checked = analyzeVinIso(cleaned);
      if (!checked.isValid) {
        setError(checked.validationMessage ?? 'Invalid 17-character VIN.');
        return;
      }
      setIsNavigating(true);
      router.push(`/report/${encodeURIComponent(checked.normalized)}?kind=vin`);
      return;
    }

    if (country === 'IT') {
      const checked = analyzeItalianPlate(cleaned);
      if (!checked.isValid) {
        setError(checked.validationMessage ?? 'Invalid Italian license plate.');
        return;
      }
    } else if (cleaned.length < 2 || cleaned.length > 12) {
      setError('License plate must be between 2 and 12 alphanumeric characters.');
      return;
    }

    setIsNavigating(true);
    router.push(`/report/${encodeURIComponent(cleaned)}?country=${country}&kind=plate`);
  }

  function loadImageFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoFileName(file.name || 'screenshot.png');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) loadImageFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) loadImageFile(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          loadImageFile(file);
          break;
        }
      }
    }
  }

  const plateBandCode = tab === 'vin' ? 'VIN' : country;

  return (
    <div className="search-card" onPaste={handlePaste}>
      <div className="mode-tabs" role="tablist" aria-label="Lookup mode">
        <button
          id="tab-plate"
          type="button"
          role="tab"
          aria-selected={tab === 'plate'}
          className={`mode-tab ${tab === 'plate' ? 'active' : ''}`}
          onClick={() => {
            setTab('plate');
            setError(null);
          }}
        >
          License Plate
        </button>
        <button
          id="tab-vin"
          type="button"
          role="tab"
          aria-selected={tab === 'vin'}
          className={`mode-tab ${tab === 'vin' ? 'active' : ''}`}
          onClick={() => {
            setTab('vin');
            setError(null);
          }}
        >
          VIN (17 chars)
        </button>
        <button
          id="tab-photo-ocr"
          type="button"
          role="tab"
          aria-selected={tab === 'photo'}
          className={`mode-tab ${tab === 'photo' ? 'active' : ''}`}
          onClick={() => {
            setTab('photo');
            setError(null);
          }}
        >
          Photo
          <span className="mode-badge">Ph. 2</span>
        </button>
      </div>

      {tab === 'photo' && (
        <div style={{ marginBottom: 16 }}>
          <div
            className="photo-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload a photo or screenshot"
            />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
              Upload a photo, drag &amp; drop, or paste a screenshot (Ctrl+V)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
              Stays locally in your browser · Phase 2 will add automatic OCR extraction
            </div>
          </div>

          {photoPreviewUrl && (
            <div className="photo-preview-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreviewUrl}
                alt={`Preview ${photoFileName ?? 'plate image'}`}
                className="photo-preview-img"
              />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {tab !== 'vin' && (
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="country-select"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-secondary)' }}
            >
              Registration Country (Europe)
            </label>
            <select
              id="country-select"
              className="country-select"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value as EuropeanCountryCode);
                setError(null);
              }}
            >
              {EUROPEAN_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code}) — {c.liveApiLabel}
                </option>
              ))}
            </select>
          </div>
        )}

        <label
          htmlFor="vehicle-query-input"
          style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-secondary)' }}
        >
          {tab === 'vin'
            ? '17-Character Vehicle Identification Number (VIN)'
            : `${selectedCountry.name} License Plate`}
        </label>

        <div className={`plate-input-shell ${error ? 'invalid' : ''}`}>
          <div className="plate-band" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#F8D231" strokeWidth="1.4" strokeDasharray="1.6 2.6" />
            </svg>
            <span className="plate-country" style={{ fontSize: tab === 'vin' ? '0.68rem' : '0.85rem' }}>
              {plateBandCode}
            </span>
          </div>

          <input
            id="vehicle-query-input"
            name="query"
            type="text"
            value={rawInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={tab === 'vin' ? 'WVWZZZCDZMW000084' : selectedCountry.platePlaceholder}
            maxLength={tab === 'vin' ? 17 : 12}
            autoComplete="off"
            spellCheck={false}
            className="plate-text-input"
            style={{ fontSize: tab === 'vin' ? '1.1rem' : undefined, letterSpacing: tab === 'vin' ? '0.08em' : undefined }}
          />
        </div>

        <div
          className={`plate-live-meta ${
            error
              ? 'error'
              : (itAnalysis?.isValid || vinAnalysis?.isValid)
              ? 'valid'
              : ''
          }`}
          aria-live="polite"
        >
          {error ? (
            <span>{error}</span>
          ) : tab === 'vin' && vinAnalysis?.isValid ? (
            <>
              <span>
                Valid ISO 3779 VIN · {vinAnalysis.manufacturer ?? `WMI ${vinAnalysis.wmi}`}
              </span>
              <span className="mono">{vinAnalysis.modelYear ?? 'EU'}</span>
            </>
          ) : itAnalysis?.isValid ? (
            <>
              <span>
                {itAnalysis.plateCategory} · Series {itAnalysis.seriesCode}
              </span>
              <span className="mono">~{itAnalysis.estimatedRegistrationPeriod}</span>
            </>
          ) : (
            <span>
              {tab === 'vin'
                ? 'Queries ISO 3779 WMI + live NHTSA vPIC & Recalls APIs + EU VIN portals.'
                : selectedCountry.liveApiTier === 'open_keyless'
                ? '100% live keyless government API (zero fabricated estimates).'
                : 'Real data only — zero fake estimates; routes to official free portals or free gov API.'}
            </span>
          )}
        </div>

        <button
          id="submit-vehicle-lookup"
          type="submit"
          className="btn-primary"
          disabled={isNavigating}
        >
          {isNavigating
            ? 'Querying real registries…'
            : tab === 'vin'
            ? 'Run Live VIN Lookup'
            : `Run ${selectedCountry.name} Lookup`}
        </button>
      </form>

      <div className="sample-presets">
        <p className="sample-presets-title">Test live real-data lookups right now</p>
        <div className="sample-list">
          {LIVE_EXAMPLES.map((ex) => (
            <button
              key={`${ex.kind}-${ex.query}`}
              type="button"
              className="sample-item"
              onClick={() => {
                setIsNavigating(true);
                const params = new URLSearchParams({ kind: ex.kind });
                if (ex.country) params.set('country', ex.country);
                router.push(`/report/${encodeURIComponent(ex.query)}?${params.toString()}`);
              }}
            >
              <span className="sample-item-left">
                <span className="mini-plate">{ex.badge}</span>
                <span className="sample-item-model">{ex.label}</span>
              </span>
              <span className={`sample-item-tag ${ex.tone === 'ok' ? 'ok' : 'warning'}`}>{ex.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
