import { DamageEvent, DamageZoneId, VehicleType } from '@/types/report';

interface DamageDiagramProps {
  vehicleType: VehicleType;
  events: DamageEvent[];
}

function getZoneSeverity(
  zone: DamageZoneId,
  events: DamageEvent[]
): 'none' | 'mild' | 'severe' {
  let state: 'none' | 'mild' | 'severe' = 'none';
  for (const event of events) {
    if (!event.zones.includes(zone)) continue;
    if (event.severity === 'Severe' || event.severity === 'Moderate') {
      return 'severe';
    }
    state = 'mild';
  }
  return state;
}

function zoneFill(severity: 'none' | 'mild' | 'severe'): string {
  if (severity === 'severe') return 'rgba(198, 40, 57, 0.24)';
  if (severity === 'mild') return 'rgba(186, 114, 14, 0.24)';
  return 'rgba(21, 27, 40, 0.03)';
}

function zoneStroke(severity: 'none' | 'mild' | 'severe'): string {
  if (severity === 'severe') return '#C62839';
  if (severity === 'mild') return '#B8720E';
  return '#B8C1D1';
}

export function DamageDiagram({ vehicleType, events }: DamageDiagramProps) {
  const isTwoWheels = vehicleType === 'motorcycle' || vehicleType === 'moped';

  return (
    <div className="damage-diagram-box">
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--ink-muted)',
          marginBottom: 10,
        }}
      >
        {isTwoWheels ? 'Motorcycle Zone Blueprint' : 'Car Body Zone Blueprint'}
      </div>

      {isTwoWheels ? (
        <svg
          viewBox="0 0 280 175"
          style={{ width: '100%', maxWidth: 280, height: 'auto' }}
          role="img"
          aria-label="Motorcycle damage zone diagram"
        >
          <circle
            cx="64"
            cy="126"
            r="32"
            fill={zoneFill(getZoneSeverity('rear-wheel', events))}
            stroke={zoneStroke(getZoneSeverity('rear-wheel', events))}
            strokeWidth="2.5"
          />
          <circle cx="64" cy="126" r="14" fill="none" stroke="#8C97AB" strokeWidth="1.5" />

          <circle
            cx="216"
            cy="126"
            r="32"
            fill={zoneFill(getZoneSeverity('front-wheel', events))}
            stroke={zoneStroke(getZoneSeverity('front-wheel', events))}
            strokeWidth="2.5"
          />
          <circle cx="216" cy="126" r="14" fill="none" stroke="#8C97AB" strokeWidth="1.5" />

          <path
            d="M54 114 L122 126 L122 138 L50 128 Z"
            fill={zoneFill(getZoneSeverity('exhaust', events))}
            stroke={zoneStroke(getZoneSeverity('exhaust', events))}
            strokeWidth="2.2"
          />

          <path
            d="M84 86 L154 70 L182 88 L152 120 L92 114 Z"
            fill={zoneFill(getZoneSeverity('tank-frame', events))}
            stroke={zoneStroke(getZoneSeverity('tank-frame', events))}
            strokeWidth="2.2"
          />

          <path
            d="M168 54 L208 62 L218 118 L194 118 L180 86 Z"
            fill={zoneFill(getZoneSeverity('fairing', events))}
            stroke={zoneStroke(getZoneSeverity('fairing', events))}
            strokeWidth="2.2"
          />

          <text x="64" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Rear
          </text>
          <text x="142" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Frame / Exhaust
          </text>
          <text x="216" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Front
          </text>
        </svg>
      ) : (
        <svg
          viewBox="0 0 220 330"
          style={{ width: '100%', maxWidth: 210, height: 'auto' }}
          role="img"
          aria-label="Car body damage zone diagram"
        >
          <path
            d="M64 26 Q110 10 156 26 L164 82 L56 82 Z"
            fill={zoneFill(getZoneSeverity('front', events))}
            stroke={zoneStroke(getZoneSeverity('front', events))}
            strokeWidth="2.2"
          />
          <rect
            x="38"
            y="84"
            width="28"
            height="82"
            rx="8"
            fill={zoneFill(getZoneSeverity('left-front', events))}
            stroke={zoneStroke(getZoneSeverity('left-front', events))}
            strokeWidth="2.2"
          />
          <rect
            x="154"
            y="84"
            width="28"
            height="82"
            rx="8"
            fill={zoneFill(getZoneSeverity('right-front', events))}
            stroke={zoneStroke(getZoneSeverity('right-front', events))}
            strokeWidth="2.2"
          />
          <rect
            x="70"
            y="92"
            width="80"
            height="140"
            rx="14"
            fill={zoneFill(getZoneSeverity('roof', events))}
            stroke={zoneStroke(getZoneSeverity('roof', events))}
            strokeWidth="2.2"
          />
          <rect
            x="38"
            y="170"
            width="28"
            height="82"
            rx="8"
            fill={zoneFill(getZoneSeverity('left-rear', events))}
            stroke={zoneStroke(getZoneSeverity('left-rear', events))}
            strokeWidth="2.2"
          />
          <rect
            x="154"
            y="170"
            width="28"
            height="82"
            rx="8"
            fill={zoneFill(getZoneSeverity('right-rear', events))}
            stroke={zoneStroke(getZoneSeverity('right-rear', events))}
            strokeWidth="2.2"
          />
          <path
            d="M56 254 L164 254 L156 302 Q110 314 64 302 Z"
            fill={zoneFill(getZoneSeverity('rear', events))}
            stroke={zoneStroke(getZoneSeverity('rear', events))}
            strokeWidth="2.2"
          />

          <text x="110" y="58" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            FRONT
          </text>
          <text x="110" y="166" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            ROOF
          </text>
          <text x="110" y="286" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            REAR
          </text>
          <text x="20" y="168" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            L
          </text>
          <text x="200" y="168" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            R
          </text>
        </svg>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginTop: 12,
          fontSize: '0.78rem',
          color: 'var(--ink-secondary)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#E5E9F0', border: '1px solid #B8C1D1' }} />
          Intact
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(186,114,14,0.35)', border: '1px solid #B8720E' }} />
          Minor
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(198,40,57,0.32)', border: '1px solid #C62839' }} />
          Moderate / Severe
        </span>
      </div>
    </div>
  );
}
