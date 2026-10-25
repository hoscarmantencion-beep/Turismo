import { GoogleGenAI, Type } from "@google/genai";

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

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export async function calculateTollsWithGemini(params: {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  vehicleType?: string;
  dayType?: string;
}): Promise<TollsCalculationResult> {
  const ai = getAiClient();
  const vehicle = params.vehicleType || 'auto';
  const day = params.dayType || 'habil';

  if (ai) {
    try {
      const prompt = `Calcula los costos de TAG (peaje electrónico pórticos urbanos / autopistas concesionadas) y peajes manuales (troncales y laterales de carreteras) para un viaje vehicular desde "${params.origin}" hasta "${params.destination}".
Distancia estimada: ${params.distanceKm.toFixed(1)} km.
Tiempo estimado de viaje: ${params.durationMinutes.toFixed(0)} minutos.
Tipo de vehículo: ${vehicle} (auto, camioneta o similar).
Día de viaje: ${day}.

Identifica con alta precisión:
1. Autopistas y rutas recorridas (ej: Costanera Norte, Autopista Central, Vespucio Sur/Oriente, Ruta 68, Ruta 5 Sur, Ruta 78, etc.).
2. Pórticos TAG involucrados y su tarifa promedio aproximada (en pesos chilenos CLP, o moneda local si es fuera de Chile).
3. Plazas de peaje manual / troncal (ej: Lo Prado, Zapata, Angostura, Lampa, etc.) y su tarifa actualizada.
4. Total estimado de TAG, total peajes manuales y suma total de peajes.
5. Consejo o advertencia vial inteligente para el conductor (ej: horarios punta TBFP/TS, pase diario si no tiene TAG, desvíos opcionales).

Devuelve obligatoriamente un JSON estructurado según el schema especificado con montos numéricos enteros.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Eres un perito experto en vialidad, tarifas de concesiones viales, autopistas urbanas (TAG), y plazas de peaje de Chile y Latinoamérica. Siempre entregas cálculos exactos, detallados y valores realistas en Pesos Chilenos (CLP) o moneda local del trayecto.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalTagCost: { type: Type.INTEGER, description: 'Costo total estimado en TAG electrónico' },
              totalManualTollsCost: { type: Type.INTEGER, description: 'Costo total estimado en peajes manuales / troncales' },
              totalTollsCost: { type: Type.INTEGER, description: 'Suma total de todos los peajes y TAG' },
              hasElectronicToll: { type: Type.BOOLEAN, description: 'Si la ruta utiliza autopistas con TAG' },
              highways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Nombres de las autopistas y carreteras principales del trayecto'
              },
              tolls: {
                type: Type.ARRAY,
                description: 'Lista detallada de peajes y pórticos TAG',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Nombre del pórtico o plaza de peaje' },
                    type: {
                      type: Type.STRING,
                      description: 'tag_electronico, peaje_manual, peaje_troncal o peaje_lateral'
                    },
                    highway: { type: Type.STRING, description: 'Carretera o autopista' },
                    estimatedCost: { type: Type.INTEGER, description: 'Costo estimado en CLP' },
                    peakHourSurcharge: { type: Type.BOOLEAN, description: 'Si aplica tarifa de horario punta' },
                    notes: { type: Type.STRING, description: 'Detalle o ubicación del cobro' }
                  },
                  required: ['name', 'type', 'highway', 'estimatedCost']
                }
              },
              aiAdvice: { type: Type.STRING, description: 'Recomendación vial, alternativas o consideraciones de horarios' }
            },
            required: ['totalTagCost', 'totalManualTollsCost', 'totalTollsCost', 'hasElectronicToll', 'highways', 'tolls', 'aiAdvice']
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          origin: params.origin,
          destination: params.destination,
          totalTagCost: Number(parsed.totalTagCost) || 0,
          totalManualTollsCost: Number(parsed.totalManualTollsCost) || 0,
          totalTollsCost: Number(parsed.totalTollsCost) || ((Number(parsed.totalTagCost) || 0) + (Number(parsed.totalManualTollsCost) || 0)),
          hasElectronicToll: Boolean(parsed.hasElectronicToll),
          highways: Array.isArray(parsed.highways) ? parsed.highways : [],
          tolls: Array.isArray(parsed.tolls) ? parsed.tolls : [],
          aiAdvice: parsed.aiAdvice || 'Calculado con IA según las autopistas de la ruta.',
          currency: 'CLP',
          vehicleType: vehicle,
          source: 'gemini_ai',
        };
      }
    } catch (err) {
      console.error('Error invoking Gemini for toll calculation, using heuristic matrix:', err);
    }
  }

  // Fallback heuristic matrix tailored to Chile highways & urban freeways
  return calculateFallbackTolls(params);
}

function calculateFallbackTolls(params: {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  vehicleType?: string;
}): TollsCalculationResult {
  const normOrigin = params.origin.toLowerCase();
  const normDest = params.destination.toLowerCase();
  const text = `${normOrigin} ${normDest}`;
  const tolls: TollItem[] = [];
  const highways: string[] = [];

  let tagCost = 0;
  let manualCost = 0;

  // Santiago <-> Valparaíso / Viña del Mar
  if ((text.includes('santiago') || text.includes('maipu') || text.includes('providencia') || text.includes('las condes')) &&
      (text.includes('viña') || text.includes('vina') || text.includes('valparaiso') || text.includes('valparaíso') || text.includes('reñaca') || text.includes('concon') || text.includes('concón'))) {
    highways.push('Ruta 68', 'Costanera Norte');
    tolls.push({
      name: 'Pórticos TAG Enlace Costanera / Vespucio',
      type: 'tag_electronico',
      highway: 'Costanera Norte',
      estimatedCost: 1950,
      notes: 'Pórticos urbanos de salida de Santiago'
    });
    tolls.push({
      name: 'Peaje Troncal Lo Prado',
      type: 'peaje_troncal',
      highway: 'Ruta 68',
      estimatedCost: 2600,
      notes: 'Tarifa normal autos y camionetas'
    });
    tolls.push({
      name: 'Peaje Troncal Zapata',
      type: 'peaje_troncal',
      highway: 'Ruta 68',
      estimatedCost: 2600,
      notes: 'Tarifa normal autos y camionetas'
    });
    tagCost = 1950;
    manualCost = 5200;
  }
  // Santiago <-> Rancagua / Talca / Sur
  else if (text.includes('santiago') && (text.includes('rancagua') || text.includes('talca') || text.includes('chillan') || text.includes('concepcion') || text.includes('concepción') || text.includes('temuco') || text.includes('puerto montt'))) {
    highways.push('Ruta 5 Sur', 'Autopista Central');
    tolls.push({
      name: 'Pórticos TAG Autopista Central Norte-Sur',
      type: 'tag_electronico',
      highway: 'Autopista Central',
      estimatedCost: 2400,
      notes: 'Pórticos de cruce urbano'
    });
    tolls.push({
      name: 'Peaje Troncal Nueva Angostura',
      type: 'peaje_troncal',
      highway: 'Ruta 5 Sur',
      estimatedCost: 3500,
      notes: 'Acceso y salida Metropolitana Sur'
    });
    tagCost = 2400;
    manualCost = 3500;
    if (params.distanceKm > 200) {
      tolls.push({
        name: 'Peaje Troncal Quinta / Chimbarongo',
        type: 'peaje_troncal',
        highway: 'Ruta 5 Sur',
        estimatedCost: 3200,
        notes: 'Tramo O\'Higgins - Maule'
      });
      manualCost += 3200;
    }
  }
  // Santiago <-> San Antonio / Melipilla
  else if (text.includes('santiago') && (text.includes('san antonio') || text.includes('algarrobo') || text.includes('el quisco') || text.includes('melipilla'))) {
    highways.push('Autopista del Sol (Ruta 78)');
    tolls.push({
      name: 'Pórticos TAG Ruta 78 Melipilla',
      type: 'tag_electronico',
      highway: 'Autopista del Sol',
      estimatedCost: 2100,
      notes: 'Sistema Free Flow Ruta 78'
    });
    tolls.push({
      name: 'Pórtico Troncal Puangue',
      type: 'tag_electronico',
      highway: 'Autopista del Sol',
      estimatedCost: 2300,
      notes: 'Cobro automatizado'
    });
    tagCost = 4400;
  }
  // Santiago Urbano (ej. Aeropuerto, Las Condes a Maipu, etc.)
  else if (text.includes('aeropuerto') || text.includes('pudahuel') || (text.includes('santiago') && params.distanceKm < 50)) {
    highways.push('Costanera Norte', 'Vespucio Norte');
    tolls.push({
      name: 'Pórtico TAG Costanera Oriente - Poniente',
      type: 'tag_electronico',
      highway: 'Costanera Norte',
      estimatedCost: 1850,
      notes: 'Tarifa base fuera de punta'
    });
    tolls.push({
      name: 'Pórtico Ramal Aeropuerto AMB',
      type: 'tag_electronico',
      highway: 'Costanera Norte / Enlace Aeropuerto',
      estimatedCost: 1100,
      notes: 'Acceso terminal Pudahuel'
    });
    tagCost = 2950;
  }
  // Generic Chilean / Latin highway calculation by distance
  else {
    const estimatedPorticos = Math.max(1, Math.floor(params.distanceKm / 35));
    if (params.distanceKm > 60) {
      highways.push('Ruta Troncal Interurbana');
      const troncales = Math.floor(params.distanceKm / 75);
      for (let i = 1; i <= troncales; i++) {
        tolls.push({
          name: `Peaje Troncal Km ${i * 70}`,
          type: 'peaje_troncal',
          highway: 'Ruta Concesionada',
          estimatedCost: 3200,
          notes: 'Peaje de carretera interurbana'
        });
        manualCost += 3200;
      }
    }
    // TAG for urban segments
    tolls.push({
      name: 'Pórticos TAG Autopista Concesionada',
      type: 'tag_electronico',
      highway: 'Autopista Urbana',
      estimatedCost: Math.min(3600, estimatedPorticos * 950),
      notes: 'Pase con dispositivo TAG habilitado'
    });
    tagCost = Math.min(3600, estimatedPorticos * 950);
  }

  const total = tagCost + manualCost;
  return {
    origin: params.origin,
    destination: params.destination,
    totalTagCost: tagCost,
    totalManualTollsCost: manualCost,
    totalTollsCost: total,
    hasElectronicToll: tagCost > 0,
    highways: highways.length > 0 ? highways : ['Carretera Principal'],
    tolls,
    aiAdvice: 'Cálculo estimado basado en las autopistas concesionadas y plazas troncales activas en la ruta. Ten tu TAG al día y dinero en efectivo o tarjetas compatibles para peajes manuales.',
    currency: 'CLP',
    vehicleType: params.vehicleType || 'auto',
    source: 'fallback_matrix',
  };
}
