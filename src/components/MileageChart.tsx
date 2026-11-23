'use client';

import { useState } from 'react';
import { MileageReading } from '@/types/report';

interface MileageChartProps {
  readings: MileageReading[];
}

export function MileageChart({ readings }: MileageChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(readings.length - 1);

  if (readings.length === 0) {
    return (
      <div className="chart-container" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
        No odometer readings available.
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padLeft = 64;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 42;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxKm = Math.max(...readings.map((r) => r.km), 10000);
  const roundedMax = Math.ceil(maxKm / 20000) * 20000;

  const points = readings.map((reading, index) => {
    const x =
      readings.length === 1
        ? padLeft + chartW / 2
        : padLeft + (index / (readings.length - 1)) * chartW;
    const y = padTop + chartH - (reading.km / roundedMax) * chartH;
    return { x, y, reading, index };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    km: Math.round(roundedMax * ratio),
    y: padTop + chartH - ratio * chartH,
  }));

  const selected = points[Math.min(activeIndex, points.length - 1)] ?? points[0];

  return (
    <div className="chart-container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 12,
          fontSize: '0.84rem',
        }}
      >
        <div>
          <strong className="mono">{selected.reading.km.toLocaleString('en-US')} km</strong>{' '}
          <span style={{ color: 'var(--ink-secondary)' }}>
            · {selected.reading.date} · {selected.reading.source}
          </span>
        </div>
        {selected.reading.anomaly && (
          <span className="status-pill danger">Rollback / Anomaly Detected</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label="Chronological odometer readings chart"
      >
        {yTicks.map((tick) => (
          <g key={tick.km}>
            <line
              x1={padLeft}
              y1={tick.y}
              x2={width - padRight}
              y2={tick.y}
              stroke="#DCE1EA"
              strokeWidth="1"
              strokeDasharray={tick.km === 0 ? undefined : '4 4'}
            />
            <text
              x={padLeft - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#687387"
              fontFamily="var(--font-mono), monospace"
            >
              {tick.km >= 1000 ? `${Math.round(tick.km / 1000)}k` : '0'}
            </text>
          </g>
        ))}

        {points.slice(0, -1).map((pt, idx) => {
          const next = points[idx + 1];
          const isDrop = next.reading.km < pt.reading.km || Boolean(next.reading.anomaly);
          return (
            <line
              key={`${pt.reading.date}-${next.reading.date}`}
              x1={pt.x}
              y1={pt.y}
              x2={next.x}
              y2={next.y}
              stroke={isDrop ? '#C62839' : '#154BB0'}
              strokeWidth={isDrop ? '3.5' : '3'}
              strokeDasharray={isDrop ? '7 5' : undefined}
              strokeLinecap="round"
            />
          );
        })}

        {points.map((pt) => {
          const isSelected = pt.index === selected.index;
          const isAnomaly = Boolean(pt.reading.anomaly);
          const yearLabel = pt.reading.date.slice(0, 7);

          return (
            <g
              key={`${pt.reading.date}-${pt.index}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setActiveIndex(pt.index)}
              onClick={() => setActiveIndex(pt.index)}
            >
              {isSelected && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="11"
                  fill={isAnomaly ? 'rgba(198, 40, 57, 0.16)' : 'rgba(21, 75, 176, 0.14)'}
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? '6' : '5'}
                fill={isAnomaly ? '#C62839' : '#FFFFFF'}
                stroke={isAnomaly ? '#C62839' : '#154BB0'}
                strokeWidth="2.5"
              />
              <text
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fill={isSelected ? '#151B28' : '#687387'}
                fontWeight={isSelected ? '700' : '500'}
                fontFamily="var(--font-mono), monospace"
              >
                {yearLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
