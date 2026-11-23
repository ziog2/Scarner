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
    if (event.severity === 'Grave' || event.severity === 'Moderato') {
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
        {isTwoWheels ? 'Mappa zone moto' : 'Mappa zone carrozzeria'}
      </div>

      {isTwoWheels ? (
        <svg
          viewBox="0 0 280 175"
          style={{ width: '100%', maxWidth: 280, height: 'auto' }}
          role="img"
          aria-label="Diagramma zone danneggiate motociclo"
        >
          {/* Rear wheel */}
          <circle
            cx="64"
            cy="126"
            r="32"
            fill={zoneFill(getZoneSeverity('rear-wheel', events))}
            stroke={zoneStroke(getZoneSeverity('rear-wheel', events))}
            strokeWidth="2.5"
          />
          <circle cx="64" cy="126" r="14" fill="none" stroke="#8C97AB" strokeWidth="1.5" />

          {/* Front wheel */}
          <circle
            cx="216"
            cy="126"
            r="32"
            fill={zoneFill(getZoneSeverity('front-wheel', events))}
            stroke={zoneStroke(getZoneSeverity('front-wheel', events))}
            strokeWidth="2.5"
          />
          <circle cx="216" cy="126" r="14" fill="none" stroke="#8C97AB" strokeWidth="1.5" />

          {/* Exhaust */}
          <path
            d="M54 114 L122 126 L122 138 L50 128 Z"
            fill={zoneFill(getZoneSeverity('exhaust', events))}
            stroke={zoneStroke(getZoneSeverity('exhaust', events))}
            strokeWidth="2.2"
          />

          {/* Tank & frame */}
          <path
            d="M84 86 L154 70 L182 88 L152 120 L92 114 Z"
            fill={zoneFill(getZoneSeverity('tank-frame', events))}
            stroke={zoneStroke(getZoneSeverity('tank-frame', events))}
            strokeWidth="2.2"
          />

          {/* Front fairing & fork */}
          <path
            d="M168 54 L208 62 L218 118 L194 118 L180 86 Z"
            fill={zoneFill(getZoneSeverity('fairing', events))}
            stroke={zoneStroke(getZoneSeverity('fairing', events))}
            strokeWidth="2.2"
          />

          {/* Labels */}
          <text x="64" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Posteriore
          </text>
          <text x="142" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Telaio / Scarico
          </text>
          <text x="216" y="170" textAnchor="middle" fontSize="10" fill="#5D677B">
            Anteriore
          </text>
        </svg>
      ) : (
        <svg
          viewBox="0 0 220 330"
          style={{ width: '100%', maxWidth: 210, height: 'auto' }}
          role="img"
          aria-label="Diagramma zone danneggiate autoveicolo"
        >
          {/* Front bumper / hood */}
          <path
            d="M64 26 Q110 10 156 26 L164 82 L56 82 Z"
            fill={zoneFill(getZoneSeverity('front', events))}
            stroke={zoneStroke(getZoneSeverity('front', events))}
            strokeWidth="2.2"
          />
          {/* Left-front fender & door */}
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
          {/* Right-front fender & door */}
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
          {/* Roof / cabin */}
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
          {/* Left-rear quarter */}
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
          {/* Right-rear quarter */}
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
          {/* Rear bumper / trunk */}
          <path
            d="M56 254 L164 254 L156 302 Q110 314 64 302 Z"
            fill={zoneFill(getZoneSeverity('rear', events))}
            stroke={zoneStroke(getZoneSeverity('rear', events))}
            strokeWidth="2.2"
          />

          <text x="110" y="58" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            ANT
          </text>
          <text x="110" y="166" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            TETTO
          </text>
          <text x="110" y="286" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            POST
          </text>
          <text x="20" y="168" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            SX
          </text>
          <text x="200" y="168" textAnchor="middle" fontSize="10" fill="#5D677B" fontWeight="600">
            DX
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
          Integra
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(186,114,14,0.35)', border: '1px solid #B8720E' }} />
          Lieve
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(198,40,57,0.32)', border: '1px solid #C62839' }} />
          Moderato / Grave
        </span>
      </div>
    </div>
  );
}
