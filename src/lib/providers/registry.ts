import { analyzeItalianPlate } from '@/lib/plate/italianPlate';
import { DemoVehicleProvider } from '@/lib/providers/demoProvider';
import { VehicleDataProvider } from '@/lib/providers/types';
import { PlateAnalysis, VehicleReport, VehicleType } from '@/types/report';

const providers: VehicleDataProvider[] = [
  // Register live API / open-data providers before DemoVehicleProvider so they take priority automatically.
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
      error: plate.validationMessage ?? 'Invalid license plate.',
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
    error: 'No vehicle data providers are currently available.',
    plate,
  };
}
