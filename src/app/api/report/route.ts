import { NextRequest, NextResponse } from 'next/server';
import { generateVehicleReport } from '@/lib/providers/registry';
import { VehicleType } from '@/types/report';

const ALLOWED_TYPES: VehicleType[] = ['car', 'motorcycle', 'moped'];

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get('plate') ?? '';
  const typeParam = request.nextUrl.searchParams.get('type') as VehicleType | null;
  const vehicleType = typeParam && ALLOWED_TYPES.includes(typeParam) ? typeParam : undefined;

  const outcome = await generateVehicleReport(plate, vehicleType);

  if (!outcome.ok) {
    return NextResponse.json(
      {
        error: outcome.error,
        plate: outcome.plate,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(outcome.report, { status: 200 });
}
