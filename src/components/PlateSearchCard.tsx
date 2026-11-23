'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { analyzeItalianPlate, normalizePlateInput } from '@/lib/plate/italianPlate';
import { SAMPLE_PLATES } from '@/lib/providers/demoProvider';
import { VehicleType } from '@/types/report';

type InputMode = 'manual' | 'photo';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; example: string }[] = [
  { type: 'car', label: 'Car', example: 'GG 482 KL' },
  { type: 'motorcycle', label: 'Motorcycle', example: 'FE 39281' },
  { type: 'moped', label: '50cc', example: 'X2B 4KP' },
];

export function PlateSearchCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [rawPlate, setRawPlate] = useState('');
  const [submittedError, setSubmittedError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Phase 2 preview: local screenshot/photo reference
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  const analysis = useMemo(
    () => analyzeItalianPlate(rawPlate, vehicleType),
    [rawPlate, vehicleType]
  );

  const shortYear = analysis.estimatedYear ? String(analysis.estimatedYear).slice(-2) : '--';

  function handlePlateChange(value: string) {
    setSubmittedError(null);
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
    setRawPlate(cleaned);

    const detected = analyzeItalianPlate(cleaned, vehicleType);
    if (detected.isValid && detected.detectedType !== vehicleType) {
      setVehicleType(detected.detectedType);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const checked = analyzeItalianPlate(rawPlate, vehicleType);
    if (!checked.isValid) {
      setSubmittedError(checked.validationMessage ?? 'Please enter a valid license plate.');
      return;
    }

    setIsNavigating(true);
    router.push(`/report/${encodeURIComponent(checked.normalized)}?type=${checked.detectedType}`);
  }

  function loadImageFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setPhotoPreviewUrl(url);
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

  const activePlaceholder =
    VEHICLE_OPTIONS.find((item) => item.type === vehicleType)?.example ?? 'GG 482 KL';

  const hasText = normalizePlateInput(rawPlate).length > 0;
  const showInvalid = Boolean(submittedError) || (hasText && normalizePlateInput(rawPlate).length >= 6 && !analysis.isValid);

  return (
    <div className="search-card" onPaste={handlePaste}>
      <div className="mode-tabs" role="tablist" aria-label="Plate input mode">
        <button
          id="tab-manual-plate"
          type="button"
          role="tab"
          aria-selected={inputMode === 'manual'}
          className={`mode-tab ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => setInputMode('manual')}
        >
          Enter Plate
        </button>
        <button
          id="tab-photo-ocr"
          type="button"
          role="tab"
          aria-selected={inputMode === 'photo'}
          className={`mode-tab ${inputMode === 'photo' ? 'active' : ''}`}
          onClick={() => setInputMode('photo')}
        >
          Photo / Screenshot
          <span className="mode-badge">Phase 2</span>
        </button>
      </div>

      {inputMode === 'photo' && (
        <div style={{ marginBottom: 18 }}>
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
              aria-label="Upload a photo or screenshot of the license plate"
            />
            <div style={{ fontWeight: 700, fontSize: '0.94rem', marginBottom: 4 }}>
              Upload a photo, drag &amp; drop here, or paste a screenshot (Ctrl+V)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
              PNG, JPG, or WEBP — stays locally in your browser
            </div>
          </div>

          {photoPreviewUrl && (
            <div className="photo-preview-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreviewUrl}
                alt={`Preview ${photoFileName ?? 'plate photo'}`}
                className="photo-preview-img"
              />
            </div>
          )}

          <div className="photo-phase2-note">
            <strong>Automatic OCR extraction coming in Phase 2:</strong> you can already keep your
            screenshot open above as a visual reference and type the plate below to generate the
            report right away.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="vehicle-selector" role="radiogroup" aria-label="Vehicle type">
          {VEHICLE_OPTIONS.map((option) => (
            <button
              key={option.type}
              id={`vehicle-type-${option.type}`}
              type="button"
              role="radio"
              aria-checked={vehicleType === option.type}
              className={`vehicle-pill ${vehicleType === option.type ? 'active' : ''}`}
              onClick={() => setVehicleType(option.type)}
            >
              <span className="vehicle-pill-label">{option.label}</span>
              <span className="vehicle-pill-hint">{option.example}</span>
            </button>
          ))}
        </div>

        <label htmlFor="plate-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-secondary)' }}>
          License plate number (Italian EU format)
        </label>

        <div className={`plate-input-shell ${showInvalid ? 'invalid' : ''}`}>
          <div className="plate-band" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#F8D231" strokeWidth="1.4" strokeDasharray="1.6 2.6" />
            </svg>
            <span className="plate-country">I</span>
          </div>

          <input
            id="plate-input"
            name="plate"
            type="text"
            value={rawPlate}
            onChange={(e) => handlePlateChange(e.target.value)}
            placeholder={activePlaceholder}
            maxLength={10}
            autoComplete="off"
            spellCheck={false}
            className="plate-text-input"
            aria-invalid={showInvalid}
          />

          <div className="plate-band-right" aria-hidden="true">
            <span className="plate-year-circle">{shortYear}</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, opacity: 0.85 }}>IT</span>
          </div>
        </div>

        <div
          className={`plate-live-meta ${
            submittedError || showInvalid ? 'error' : analysis.isValid ? 'valid' : ''
          }`}
          aria-live="polite"
        >
          {submittedError ? (
            <span>{submittedError}</span>
          ) : analysis.isValid ? (
            <>
              <span>
                {analysis.plateCategory} · Series {analysis.seriesCode}
              </span>
              <span className="mono">~{analysis.estimatedRegistrationPeriod}</span>
            </>
          ) : showInvalid ? (
            <span>{analysis.validationMessage}</span>
          ) : (
            <span>Type the plate with or without spaces (e.g., GG482KL or FE39281).</span>
          )}
        </div>

        <button
          id="submit-plate-report"
          type="submit"
          className="btn-primary"
          disabled={isNavigating}
        >
          {isNavigating ? 'Generating report…' : 'Generate Free Report'}
        </button>
      </form>

      <div className="sample-presets">
        <p className="sample-presets-title">Or explore a full sample report</p>
        <div className="sample-list">
          {SAMPLE_PLATES.map((sample) => (
            <button
              key={sample.plate}
              id={`sample-plate-${sample.plate}`}
              type="button"
              className="sample-item"
              onClick={() => {
                setIsNavigating(true);
                router.push(`/report/${sample.plate}?type=${sample.vehicleType}`);
              }}
            >
              <span className="sample-item-left">
                <span className="mini-plate">{sample.formatted}</span>
                <span className="sample-item-model">{sample.label}</span>
              </span>
              <span className={`sample-item-tag ${sample.badgeTone}`}>{sample.highlight}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
