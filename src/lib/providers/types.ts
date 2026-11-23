import { DataOriginMode, PlateAnalysis, VehicleReport, VehicleType } from '@/types/report';

export interface ProviderLookupRequest {
  plate: PlateAnalysis;
  vehicleType: VehicleType;
}

export interface VehicleDataProvider {
  readonly id: string;
  readonly label: string;
  readonly mode: DataOriginMode;
  isAvailable(): boolean;
  fetchReport(request: ProviderLookupRequest): Promise<VehicleReport | null>;
}
