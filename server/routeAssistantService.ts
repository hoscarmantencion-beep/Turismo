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

export function generateHealthCenters(centerLat: number, centerLng: number): HealthCenter[] {
  // Generate realistic Chilean public health facilities around coordinates
  const baseCenters = [
    {
      name: 'Hospital de Urgencia Asistencia Pública (HUAP)',
      type: 'HOSPITAL' as const,
      address: 'Av. Portugal 125',
      phone: '(2) 2568 1200',
      hours: 'Atención 24 Horas',
      urgencyLevel: 'Alta (24/7)' as const,
      dLat: 0.008,
      dLng: -0.005,
    },
    {
      name: 'CESFAM Salvador Bustos',
      type: 'CESFAM' as const,
      address: 'Av. Grecia 3980',
      phone: '(2) 2787 5400',
      hours: '08:00 a 20:00 (SAPU hasta 00:00)',
      urgencyLevel: 'Media' as const,
      dLat: -0.012,
      dLng: 0.011,
    },
    {
      name: 'SAR / SAPU Dr. Fernando Monckeberg',
      type: 'SAR' as const,
      address: 'Las Torres 1450',
      phone: '(2) 2385 6200',
      hours: 'Servicio de Urgencia 24 Horas',
      urgencyLevel: 'Alta (24/7)' as const,
      dLat: 0.016,
      dLng: 0.014,
    },
    {
      name: 'Posta de Salud Rural El Tránsito',
      type: 'POSTA' as const,
      address: 'Camino Vecinal Km 4',
      phone: '131 (SAMU)',
      hours: '08:30 a 17:30 y Turno Llamada',
      urgencyLevel: 'Baja' as const,
      dLat: -0.025,
      dLng: -0.019,
    },
    {
      name: 'CESFAM Santa Anita',
      type: 'CESFAM' as const,
      address: 'Los Conquistadores 410',
      phone: '(2) 2489 3100',
      hours: '08:00 a 20:00',
      urgencyLevel: 'Media' as const,
      dLat: 0.021,
      dLng: -0.018,
    },
    {
      name: 'Hospital San Juan de Dios',
      type: 'HOSPITAL' as const,
      address: 'Huérfanos 3255',
      phone: '(2) 2574 2000',
      hours: 'Urgencia Adulto e Infantil 24/7',
      urgencyLevel: 'Alta (24/7)' as const,
      dLat: -0.018,
      dLng: 0.022,
    }
  ];

  return baseCenters.map((item, index) => {
    const lat = centerLat + item.dLat;
    const lng = centerLng + item.dLng;
    const distanceKm = Math.round((Math.sqrt(item.dLat * item.dLat + item.dLng * item.dLng) * 111) * 10) / 10;
    return {
      id: `health-${index + 1}`,
      name: item.name,
      type: item.type,
      address: item.address,
      distanceKm: Math.max(0.4, distanceKm),
      phone: item.phone,
      hours: item.hours,
      urgencyLevel: item.urgencyLevel,
      lat,
      lng,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function generateGasStations(centerLat: number, centerLng: number): GasStation[] {
  const stations = [
    {
      brand: 'Copec' as const,
      name: 'Copec Pronto & Zervo',
      address: 'Autopista Central Km 14',
      dLat: 0.006,
      dLng: 0.004,
      prices: { gas93: 1240, gas95: 1295, gas97: 1350, diesel: 980 },
      services: ['Pronto Copec', 'Baños', 'Aire/Agua', 'Carga Eléctrica Voltex', 'Cajero Automático'],
      isOpen24Hours: true,
    },
    {
      brand: 'Shell' as const,
      name: 'Shell Select V-Power',
      address: 'Av. Kennedy 5601',
      dLat: -0.009,
      dLng: 0.007,
      prices: { gas93: 1238, gas95: 1292, gas97: 1345, diesel: 978 },
      services: ['Tienda upa!', 'Cafetería Lavazza', 'Lavado Autos', 'Lubricentro'],
      isOpen24Hours: true,
    },
    {
      brand: 'Petrobras' as const,
      name: 'Petrobras Spacio1',
      address: 'Ruta 68 Km 18',
      dLat: 0.014,
      dLng: -0.011,
      prices: { gas93: 1230, gas95: 1285, gas97: 1335, diesel: 970 },
      services: ['Spacio1', 'Comida Rápida', 'Estacionamiento Camiones', 'Wi-Fi'],
      isOpen24Hours: true,
    },
    {
      brand: 'Aramco' as const,
      name: 'Aramco Pro Fuel',
      address: 'Av. Américo Vespucio 2100',
      dLat: -0.015,
      dLng: -0.013,
      prices: { gas93: 1235, gas95: 1289, gas97: 1340, diesel: 975 },
      services: ['Aramco Store', 'Cambio Aceite', 'Servicio Rápido'],
      isOpen24Hours: true,
    }
  ];

  return stations.map((st, index) => {
    const lat = centerLat + st.dLat;
    const lng = centerLng + st.dLng;
    const distanceKm = Math.round((Math.sqrt(st.dLat * st.dLat + st.dLng * st.dLng) * 111) * 10) / 10;
    return {
      id: `gas-${index + 1}`,
      brand: st.brand,
      name: st.name,
      address: st.address,
      distanceKm: Math.max(0.3, distanceKm),
      prices: st.prices,
      services: st.services,
      isOpen24Hours: st.isOpen24Hours,
      lat,
      lng,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function generateRouteAlerts(originName: string, destName: string): RouteAlert[] {
  return [
    {
      id: 'alert-1',
      type: 'accidente',
      title: 'Colisión por alcance - Pista izquierda bloqueada',
      description: 'Vehículo detenido con personal de rescate vial y conos reflectantes. Circule a velocidad reducida.',
      severity: 'alta',
      highwayOrStreet: 'Autopista Central km 18.4',
      distanceFromHereKm: 3.2,
      timestamp: 'Hace 4 min',
      verifiedByAi: true,
    },
    {
      id: 'alert-2',
      type: 'obras',
      title: 'Trabajos de mantención y repavimentación nocturna/diurna',
      description: 'Maquinaria pesada en berma y reducción a 2 pistas. Velocidad máxima 60 km/h.',
      severity: 'moderada',
      highwayOrStreet: 'Enlace Vespucio Oriente',
      distanceFromHereKm: 8.5,
      timestamp: 'Hace 15 min',
      verifiedByAi: true,
    },
    {
      id: 'alert-3',
      type: 'congestion',
      title: 'Tráfico lento por flujo alto de vehículos',
      description: 'Retraso estimado de +8 a +12 minutos hacia el peaje/enlace.',
      severity: 'moderada',
      highwayOrStreet: 'Ruta 68 antes del túnel Zapata',
      distanceFromHereKm: 14.1,
      timestamp: 'Hace 2 min',
      verifiedByAi: true,
    },
    {
      id: 'alert-4',
      type: 'radar_policia',
      title: 'Control de velocidad y documentación',
      description: 'Carabineros / Fiscalización MTT en zona de descanso.',
      severity: 'moderada',
      highwayOrStreet: 'Ruta 5 Sur km 42',
      distanceFromHereKm: 22.0,
      timestamp: 'Hace 9 min',
      verifiedByAi: false,
    }
  ];
}
