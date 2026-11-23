import { analyzeItalianPlate } from '@/lib/plate/italianPlate';
import { DemoVehicleProvider } from '@/lib/providers/demoProvider';
import { VehicleDataProvider } from '@/lib/providers/types';
import { PlateAnalysis, VehicleReport, VehicleType } from '@/types/report';

const providers: VehicleDataProvider[] = [
  // Aggiungi qui eventuali provider live (es. API open-data o connettori esterni configurati via env)
  // prima del DemoVehicleProvider, così verranno usati automaticamente con priorità maggiore.
  new DemoVehicleProvider(),
];

export type LookupOutcome =
  | { ok: true; report: VehicleReport }
  | { ok: false; error: string; plate: PlateAnalysis };

export async function generateVehicleReport(
  rawPlate: string,
  requestedType?: VehicleType
): Promise<LookupOutcome> {
  const plate = analyzeItalianPlate(rawPlate, requestedType);

  if (!plate.isValid) {
    return {
      ok: false,
      error: plate.validationMessage ?? 'Targa non valida.',
      plate,
    };
  }

  const effectiveType = plate.detectedType;

  for (const provider of providers) {
    if (!provider.isAvailable()) continue;
    const report = await provider.fetchReport({
      plate,
      vehicleType: effectiveType,
    });
    if (report) {
      return { ok: true, report };
    }
  }

  return {
    ok: false,
    error: 'Nessun provider dati disponibile al momento.',
    plate,
  };
}
