// Source: Google Maps Platform Code Assist
import React, { useEffect, useState, useRef } from 'react';
import { Map, useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';
import { RouteDetails, HealthCenter, GasStation, RouteAlert } from '../types/index.ts';
import {
  Navigation,
  Crosshair,
  Volume2,
  VolumeX,
  Gauge,
  Clock,
  MapPin,
  Flame,
  AlertTriangle,
  Hospital,
  Fuel,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface NavigationMapProps {
  origin: string;
  destination: string;
  onRouteCalculated: (route: RouteDetails) => void;
  healthCenters: HealthCenter[];
  gasStations: GasStation[];
  routeAlerts: RouteAlert[];
  selectedMarker: { type: 'health' | 'gas' | 'alert'; data: any } | null;
  onSelectMarker: (marker: { type: 'health' | 'gas' | 'alert'; data: any } | null) => void;
  navigationModeActive: boolean;
  onToggleNavigationMode: () => void;
}

export function NavigationMap({
  origin,
  destination,
  onRouteCalculated,
  healthCenters,
  gasStations,
  routeAlerts,
  selectedMarker,
  onSelectMarker,
  navigationModeActive,
  onToggleNavigationMode,
}: NavigationMapProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

  // Vehicle HUD & Navigation Simulation State
  const [vehicleSpeed, setVehicleSpeed] = useState<number>(75);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapStyleDark, setMapStyleDark] = useState<boolean>(true);
  const [showHealthMarkers, setShowHealthMarkers] = useState<boolean>(true);
  const [showGasMarkers, setShowGasMarkers] = useState<boolean>(true);
  const [showAlertMarkers, setShowAlertMarkers] = useState<boolean>(true);

  // Vehicle simulated position on route
  const [vehiclePos, setVehiclePos] = useState<{ lat: number; lng: number }>({
    lat: -33.4489,
    lng: -70.6693,
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Voice announcement helper
  const speakInstruction = (text: string) => {
    if (isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available:', e);
    }
  };

  // Speedometer simulation interval when navigation is active
  useEffect(() => {
    if (!navigationModeActive) return;
    const interval = setInterval(() => {
      setVehicleSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 4;
        const next = Math.round(Math.min(118, Math.max(45, prev + delta)));
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [navigationModeActive]);

  // Compute Route using Routes API
  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setRouteError(null);
    setLoadingRoute(true);

    const request = {
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING' as const,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        setLoadingRoute(false);
        if (!routes || routes.length === 0) {
          setRouteError('No se pudo encontrar una ruta vial entre el origen y destino.');
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#06b6d4', // Cyan electric automotive glow
            strokeWeight: 6,
            strokeOpacity: 0.95,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        // Auto-fit bounds
        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        // Extract steps
        const legs = primaryRoute.legs?.[0];
        const stepsList: { instruction: string; distance: string; duration: string }[] = [];
        if (legs?.steps) {
          legs.steps.forEach((st: any) => {
            const rawText = st.navigationInstruction?.instructions || st.instructions || 'Continúe por la vía principal';
            // strip HTML tags if any
            const cleanText = rawText.replace(/<[^>]*>?/gm, '');
            stepsList.push({
              instruction: cleanText,
              distance: st.localizedValues?.distance?.text || `${Math.round((st.distanceMeters || 400) / 100) / 10} km`,
              duration: st.localizedValues?.staticDuration?.text || '1 min',
            });
          });
        }

        if (stepsList.length === 0) {
          stepsList.push({
            instruction: `Inicie el viaje hacia ${destination}`,
            distance: `${((primaryRoute.distanceMeters || 1000) / 1000).toFixed(1)} km`,
            duration: `${Math.round((primaryRoute.durationMillis || 60000) / 60000)} min`,
          });
        }

        // Initial vehicle position: set near route start
        if (legs?.startLocation?.latLng) {
          const sLat = legs.startLocation.latLng.latitude || legs.startLocation.latLng.lat;
          const sLng = legs.startLocation.latLng.longitude || legs.startLocation.latLng.lng;
          if (sLat && sLng) {
            setVehiclePos({ lat: sLat, lng: sLng });
          }
        }

        const details: RouteDetails = {
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          distanceKm: Math.round(((primaryRoute.distanceMeters ?? 0) / 1000) * 10) / 10,
          durationMillis: primaryRoute.durationMillis ?? 0,
          durationMinutes: Math.round((primaryRoute.durationMillis ?? 0) / 60000),
          originAddress: origin,
          destinationAddress: destination,
          steps: stepsList,
        };

        setRouteDetails(details);
        onRouteCalculated(details);

        // Announce first instruction
        if (stepsList[0]) {
          speakInstruction(`Iniciando navegación hacia ${destination}. ${stepsList[0].instruction}`);
        }
      })
      .catch((err: any) => {
        setLoadingRoute(false);
        console.error('Error computing routes:', err);
        setRouteError(err.message || 'Error al calcular la ruta en Google Maps.');
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination]);

  const handleCenterVehicle = () => {
    if (map) {
      map.panTo(vehiclePos);
      map.setZoom(16);
    }
  };

  const handleNextStep = () => {
    if (!routeDetails?.steps) return;
    const nextIdx = (currentStepIndex + 1) % routeDetails.steps.length;
    setCurrentStepIndex(nextIdx);
    const instruction = routeDetails.steps[nextIdx]?.instruction;
    if (instruction) {
      speakInstruction(instruction);
    }
  };

  // Modern Night vs Day map styling options
  const darkMapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#171e2e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#171e2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#93a3b8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#273549' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1c2635' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#385170' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09101d' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Turn-by-Turn HUD Banner (Automotive Driving Style) */}
      {routeDetails && (
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-xl shadow-black/40">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-md">
              <Navigation className="w-6 h-6 rotate-45 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1.5">
                <span>Instrucción de Ruta</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 font-mono">
                  Paso {currentStepIndex + 1} de {routeDetails.steps.length || 1}
                </span>
              </div>
              <p className="text-sm md:text-base font-bold text-white leading-snug line-clamp-1">
                {routeDetails.steps[currentStepIndex]?.instruction || `Continúe en dirección a ${destination}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="flex items-center gap-2 text-right">
              <div>
                <span className="text-[11px] block text-slate-400">Próxima maniobra</span>
                <span className="text-sm font-bold text-cyan-300 font-mono-numbers">
                  {routeDetails.steps[currentStepIndex]?.distance || '350 m'}
                </span>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
              title="Avanzar paso de navegación"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      )}

      {/* Loading & Error Overlays */}
      {loadingRoute && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-cyan-200">Calculando trazado vial y autopistas...</p>
          </div>
        </div>
      )}

      {routeError && (
        <div className="absolute top-20 left-4 right-4 z-20 p-3 bg-red-950/90 border border-red-700 text-red-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{routeError}</span>
          </div>
          <button
            onClick={() => setRouteError(null)}
            className="px-2 py-0.5 bg-red-900 hover:bg-red-800 rounded text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* The Google Map Component */}
      <div className="w-full h-full flex-1 min-h-[380px]">
        <Map
          defaultCenter={{ lat: -33.4489, lng: -70.6693 }} // Santiago, Chile by default
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI={false}
          styles={mapStyleDark ? darkMapStyles : undefined}
          // CRITICAL: Required attribution identifier overriding subskills
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Vehicle Marker: Animated pulsing navigation beacon */}
          <AdvancedMarker position={vehiclePos} title="Tu Vehículo en Ruta">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-cyan-500/30 animate-ping" />
              <div className="relative w-9 h-9 rounded-full bg-cyan-500 border-2 border-white shadow-lg shadow-cyan-500/60 flex items-center justify-center text-slate-950">
                <Navigation className="w-5 h-5 -rotate-45" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Health Centers Markers */}
          {showHealthMarkers &&
            healthCenters.map((hc) => (
              <AdvancedMarker
                key={hc.id}
                position={{ lat: hc.lat, lng: hc.lng }}
                title={`${hc.name} (${hc.type})`}
                onClick={() => onSelectMarker({ type: 'health', data: hc })}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer transition hover:scale-125 ${
                    hc.type === 'HOSPITAL'
                      ? 'bg-rose-600 text-white'
                      : hc.type === 'CESFAM'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  <Hospital className="w-4 h-4" />
                </div>
              </AdvancedMarker>
            ))}

          {/* Gas Stations Markers */}
          {showGasMarkers &&
            gasStations.map((gs) => (
              <AdvancedMarker
                key={gs.id}
                position={{ lat: gs.lat, lng: gs.lng }}
                title={`${gs.name} (${gs.brand})`}
                onClick={() => onSelectMarker({ type: 'gas', data: gs })}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 border-2 border-slate-900 text-slate-950 shadow-md cursor-pointer transition hover:scale-125">
                  <Fuel className="w-4 h-4 font-bold" />
                </div>
              </AdvancedMarker>
            ))}

          {/* Route Incident Alert Markers */}
          {showAlertMarkers &&
            routeAlerts.map((al) => (
              <AdvancedMarker
                key={al.id}
                position={{
                  lat: vehiclePos.lat + (al.distanceFromHereKm * 0.007),
                  lng: vehiclePos.lng + (al.distanceFromHereKm * 0.006),
                }}
                title={al.title}
                onClick={() => onSelectMarker({ type: 'alert', data: al })}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white shadow-lg animate-bounce cursor-pointer">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </AdvancedMarker>
            ))}
        </Map>
      </div>

      {/* Floating Map Layer Toggles & View Controls (Right Side) */}
      <div className="absolute right-4 top-20 md:top-24 z-20 flex flex-col gap-2">
        <button
          onClick={handleCenterVehicle}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-lg backdrop-blur-md transition active:scale-95"
          title="Centrar en vehículo"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsVoiceMuted(!isVoiceMuted)}
          className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-md transition active:scale-95 ${
            isVoiceMuted
              ? 'bg-slate-900/90 text-slate-500 border-slate-700'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-600/50'
          }`}
          title={isVoiceMuted ? 'Activar voz de navegación' : 'Silenciar voz'}
        >
          {isVoiceMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setMapStyleDark(!mapStyleDark)}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md transition active:scale-95"
          title={mapStyleDark ? 'Modo Día' : 'Modo Noche'}
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Quick Marker Visibility Toggles */}
        <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex flex-col gap-1.5 text-xs">
          <button
            onClick={() => setShowHealthMarkers(!showHealthMarkers)}
            className={`p-1.5 rounded-lg flex items-center justify-center transition ${
              showHealthMarkers ? 'bg-emerald-900/70 text-emerald-300' : 'text-slate-500'
            }`}
            title="Ver/Ocultar CESFAM y Hospitales"
          >
            <Hospital className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGasMarkers(!showGasMarkers)}
            className={`p-1.5 rounded-lg flex items-center justify-center transition ${
              showGasMarkers ? 'bg-amber-900/70 text-amber-300' : 'text-slate-500'
            }`}
            title="Ver/Ocultar Bencineras"
          >
            <Fuel className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAlertMarkers(!showAlertMarkers)}
            className={`p-1.5 rounded-lg flex items-center justify-center transition ${
              showAlertMarkers ? 'bg-red-900/70 text-red-300' : 'text-slate-500'
            }`}
            title="Ver/Ocultar Alertas de Ruta"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Marker Detail Modal / Floating Card */}
      {selectedMarker && (
        <div className="absolute left-4 right-4 bottom-24 md:bottom-28 z-30 max-w-md mx-auto p-4 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  selectedMarker.type === 'health'
                    ? 'bg-rose-950 border border-rose-700 text-rose-300'
                    : selectedMarker.type === 'gas'
                    ? 'bg-amber-950 border border-amber-700 text-amber-300'
                    : 'bg-red-950 border border-red-700 text-red-300'
                }`}
              >
                {selectedMarker.type === 'health' && <Hospital className="w-5 h-5" />}
                {selectedMarker.type === 'gas' && <Fuel className="w-5 h-5" />}
                {selectedMarker.type === 'alert' && <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedMarker.type === 'health'
                    ? `Salud Pública: ${selectedMarker.data.type}`
                    : selectedMarker.type === 'gas'
                    ? `Estación de Servicio: ${selectedMarker.data.brand}`
                    : 'Alerta en Ruta'}
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {selectedMarker.data.name || selectedMarker.data.title}
                </h4>
              </div>
            </div>
            <button
              onClick={() => onSelectMarker(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-300">
            {selectedMarker.data.address || selectedMarker.data.description}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-cyan-400 font-mono-numbers font-semibold">
              A {selectedMarker.data.distanceKm || selectedMarker.data.distanceFromHereKm || 1.2} km de distancia
            </span>
            {selectedMarker.type === 'health' && (
              <a
                href={`tel:${selectedMarker.data.phone || '131'}`}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow"
              >
                <span>Llamar {selectedMarker.data.phone || '131'}</span>
              </a>
            )}
            {selectedMarker.type === 'gas' && (
              <span className="px-2 py-1 bg-amber-950 border border-amber-800 text-amber-200 rounded font-mono">
                95 Oct: ${selectedMarker.data.prices?.gas95 || 1290}/L
              </span>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cockpit / HUD Dashboard */}
      <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Speedometer */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-inner">
            <span className="text-2xl font-black text-cyan-400 font-mono-numbers tracking-tight">
              {vehicleSpeed}
            </span>
            <span className="absolute bottom-1 text-[9px] font-bold text-slate-400 uppercase">km/h</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Velocímetro GPS</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Límite vial: 100 km/h
            </span>
          </div>
        </div>

        {/* ETA & Distance summary */}
        {routeDetails && (
          <div className="flex items-center gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Distancia</span>
              <span className="text-base font-bold text-white font-mono-numbers">
                {routeDetails.distanceKm} km
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Tiempo Estimado</span>
              <span className="text-base font-bold text-cyan-300 font-mono-numbers">
                {routeDetails.durationMinutes} min
              </span>
            </div>
          </div>
        )}

        {/* Action button: Cockpit / Navigation toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleNavigationMode}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg ${
              navigationModeActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-900/30'
            }`}
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>{navigationModeActive ? 'Detener Navegación' : 'Iniciar Navegador'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
