export interface TollItem {
  name: string;
  type: 'tag_electronico' | 'peaje_manual' | 'peaje_troncal' | 'peaje_lateral';
  highway: string;
  estimatedCost: number;
  peakHourSurcharge?: boolean;
  notes?: string;
}

export interface TollsCalculationResult {
  origin: string;
  destination: string;
  totalTagCost: number;
  totalManualTollsCost: number;
  totalTollsCost: number;
  hasElectronicToll: boolean;
  highways: string[];
  tolls: TollItem[];
  aiAdvice: string;
  currency: string;
  vehicleType: string;
  source: 'gemini_ai' | 'fallback_matrix';
}

export interface TripInputs {
  origin: string;
  destination: string;
  fuelConsumptionKmPerL: number; // e.g. 12 km/L
  fuelPricePerLiter: number; // e.g. 1290 CLP
  fuelType: '93' | '95' | '97' | 'diesel' | 'glp';
  vehicleType: 'auto' | 'camioneta' | 'suv' | 'moto' | 'camion';
  numPassengers: number;
  dayType: 'habil' | 'fin_de_semana' | 'festivo';
  timeOfDay: 'valle' | 'punta' | 'normal';
}

export interface RouteTurnStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export interface RouteDetails {
  distanceMeters: number;
  distanceKm: number;
  durationMillis: number;
  durationMinutes: number;
  originAddress: string;
  destinationAddress: string;
  originCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
  steps: RouteTurnStep[];
}

export interface HealthCenter {
  id: string;
  name: string;
  type: 'CESFAM' | 'POSTA' | 'HOSPITAL' | 'SAPU' | 'SAR';
  address: string;
  distanceKm: number;
  phone: string;
  hours: string;
  urgencyLevel: 'Baja' | 'Media' | 'Alta (24/7)';
  lat: number;
  lng: number;
}

export interface GasStation {
  id: string;
  brand: 'Copec' | 'Shell' | 'Petrobras' | 'Aramco' | 'Upec';
  name: string;
  address: string;
  distanceKm: number;
  prices: {
    gas93: number;
    gas95: number;
    gas97: number;
    diesel: number;
    glp?: number;
  };
  services: string[];
  isOpen24Hours: boolean;
  lat: number;
  lng: number;
}

export interface RouteAlert {
  id: string;
  type: 'accidente' | 'obras' | 'congestion' | 'animales' | 'radar_policia' | 'clima';
  title: string;
  description: string;
  severity: 'moderada' | 'alta' | 'critica';
  highwayOrStreet: string;
  distanceFromHereKm: number;
  timestamp: string;
  verifiedByAi: boolean;
}
