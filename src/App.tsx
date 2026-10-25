// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Header, ActiveTab } from './components/Header.tsx';
import { NavigationMap } from './components/NavigationMap.tsx';
import { CostCalculator } from './components/CostCalculator.tsx';
import { HealthCentersPanel } from './components/HealthCentersPanel.tsx';
import { GasStationsPanel } from './components/GasStationsPanel.tsx';
import { RouteAlertsPanel } from './components/RouteAlertsPanel.tsx';
import {
  TripInputs,
  RouteDetails,
  TollsCalculationResult,
  HealthCenter,
  GasStation,
  RouteAlert
} from './types/index.ts';
import {
  Car,
  Fuel,
  CreditCard,
  Hospital,
  AlertTriangle,
  Sparkles,
  Navigation,
  Compass,
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

const FALLBACK_MAPS_KEY = "AIzaSyCDrWjfx9eWyFRoAvOcVwfhyS8fkTnTDi4";

export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || FALLBACK_MAPS_KEY
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Listen to Google Maps Demo Key Quota Events (Case A Mandate)
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Fetch API key from server config if missing
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.googleMapsApiKey) {
          setApiKey(data.googleMapsApiKey);
        }
      })
      .catch((err) => console.warn('Could not load api config:', err));
  }, []);

  // Route State
  const [origin, setOrigin] = useState<string>('Santiago Centro, Chile');
  const [destination, setDestination] = useState<string>('Viña del Mar, Valparaíso, Chile');
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

  // Tab & HUD Navigation Mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('navigator');
  const [navigationModeActive, setNavigationModeActive] = useState(false);

  // Vehicle Inputs State
  const [tripInputs, setTripInputs] = useState<TripInputs>({
    origin: 'Santiago Centro, Chile',
    destination: 'Viña del Mar, Valparaíso, Chile',
    fuelConsumptionKmPerL: 12.0, // 12 km/L
    fuelPricePerLiter: 1295, // $1.295 CLP/L
    fuelType: '95',
    vehicleType: 'auto',
    numPassengers: 1,
    dayType: 'habil',
    timeOfDay: 'valle',
  });

  // AI Tolls & TAG Calculation State
  const [tollsData, setTollsData] = useState<TollsCalculationResult | null>(null);
  const [loadingTolls, setLoadingTolls] = useState(false);

  // Nearby Public Facilities and Incidents
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [routeAlerts, setRouteAlerts] = useState<RouteAlert[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'health' | 'gas' | 'alert';
    data: any;
  } | null>(null);

  // Update trip inputs helper
  const handleUpdateInputs = (updated: Partial<TripInputs>) => {
    setTripInputs((prev) => ({ ...prev, ...updated }));
  };

  // Fetch AI Tolls & TAG calculation
  const calculateTolls = useCallback(async (currentOrigin: string, currentDest: string, distKm?: number) => {
    setLoadingTolls(true);
    try {
      const response = await fetch('/api/tolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: currentOrigin,
          destination: currentDest,
          distanceKm: distKm || 120,
          durationMinutes: Math.round((distKm || 120) * 0.9),
          vehicleType: tripInputs.vehicleType,
          dayType: tripInputs.dayType,
        }),
      });
      const data = await response.json();
      setTollsData(data);
    } catch (err) {
      console.error('Error fetching tolls:', err);
    } finally {
      setLoadingTolls(false);
    }
  }, [tripInputs.vehicleType, tripInputs.dayType]);

  // Fetch Nearby Facilities & Alerts
  const fetchCorridorData = useCallback(async (lat: number, lng: number, oStr: string, dStr: string) => {
    try {
      const [hRes, gRes, aRes] = await Promise.all([
        fetch(`/api/health-centers?lat=${lat}&lng=${lng}`),
        fetch(`/api/gas-stations?lat=${lat}&lng=${lng}`),
        fetch(`/api/route-alerts?origin=${encodeURIComponent(oStr)}&destination=${encodeURIComponent(dStr)}`),
      ]);

      const [hData, gData, aData] = await Promise.all([
        hRes.json(),
        gRes.json(),
        aRes.json(),
      ]);

      if (hData.centers) setHealthCenters(hData.centers);
      if (gData.stations) setGasStations(gData.stations);
      if (aData.alerts) setRouteAlerts(aData.alerts);
    } catch (e) {
      console.error('Error fetching corridor data:', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    calculateTolls(origin, destination, 120);
    fetchCorridorData(-33.4489, -70.6693, origin, destination);
  }, []);

  // Route changed handler
  const handleRouteChanged = (newOrigin: string, newDest: string) => {
    setOrigin(newOrigin);
    setDestination(newDest);
    setTripInputs((prev) => ({ ...prev, origin: newOrigin, destination: newDest }));
    calculateTolls(newOrigin, newDest);
    fetchCorridorData(-33.4489, -70.6693, newOrigin, newDest);
  };

  // Called when Route.computeRoutes finishes in NavigationMap
  const handleRouteCalculated = (route: RouteDetails) => {
    setRouteDetails(route);
    // Recalculate with exact distance
    calculateTolls(origin, destination, route.distanceKm);
  };

  // Handle reporting incident
  const handleReportIncident = async (newAlert: Partial<RouteAlert>) => {
    try {
      const response = await fetch('/api/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      });
      const data = await response.json();
      if (data.incident) {
        setRouteAlerts((prev) => [data.incident, ...prev]);
        setSelectedMarker({ type: 'alert', data: data.incident });
      }
    } catch (e) {
      console.error('Error reporting incident:', e);
    }
  };

  // Cost numbers for quick header widget
  const distance = routeDetails?.distanceKm || 120;
  const fuelCost = Math.round((distance / Math.max(1, tripInputs.fuelConsumptionKmPerL)) * tripInputs.fuelPricePerLiter);
  const totalTolls = tollsData?.totalTollsCost || 7150;
  const totalTripCost = fuelCost + totalTolls;

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Tier 2 Quota Banner for Demo Key (Case A Requirement) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        origin={origin}
        destination={destination}
        onChangeRoute={handleRouteChanged}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        alertCount={routeAlerts.length}
      />

      {/* Main Application Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-5">
        <APIProvider apiKey={apiKey}>
          {/* Quick HUD Metrics Bar (Always Visible Quick Overview) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Gasto Total */}
            <div
              onClick={() => setActiveTab('calculator')}
              className="p-3 bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                  Total Estimado
                </span>
                <span className="text-base sm:text-lg font-black text-white font-mono-numbers">
                  {formatCLP(totalTripCost)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            {/* Combustible */}
            <div
              onClick={() => setActiveTab('calculator')}
              className="p-3 bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                  Bencina ({tripInputs.fuelConsumptionKmPerL} km/L)
                </span>
                <span className="text-base sm:text-lg font-bold text-amber-200 font-mono-numbers">
                  {formatCLP(fuelCost)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
                <Fuel className="w-4 h-4" />
              </div>
            </div>

            {/* TAG & Peajes */}
            <div
              onClick={() => setActiveTab('calculator')}
              className="p-3 bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block flex items-center gap-1">
                  TAG & Peajes <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                </span>
                <span className="text-base sm:text-lg font-bold text-purple-200 font-mono-numbers">
                  {loadingTolls ? 'Calculando...' : formatCLP(totalTolls)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-950 text-purple-400">
                <Car className="w-4 h-4" />
              </div>
            </div>

            {/* Red Asistencia */}
            <div
              onClick={() => setActiveTab('health')}
              className="p-3 bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block">
                  Salud GPS & Alertas
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                  <span className="text-rose-400">{healthCenters.length} Centros</span>
                  <span>•</span>
                  <span className="text-red-400">{routeAlerts.length} Alertas</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-rose-950 text-rose-400">
                <Hospital className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Tab 1: Fullscreen Automotive GPS Navigator View */}
          {activeTab === 'navigator' && (
            <div className="flex flex-col gap-4">
              <div className="h-[58vh] min-h-[460px] w-full">
                <NavigationMap
                  origin={origin}
                  destination={destination}
                  onRouteCalculated={handleRouteCalculated}
                  healthCenters={healthCenters}
                  gasStations={gasStations}
                  routeAlerts={routeAlerts}
                  selectedMarker={selectedMarker}
                  onSelectMarker={setSelectedMarker}
                  navigationModeActive={navigationModeActive}
                  onToggleNavigationMode={() => setNavigationModeActive(!navigationModeActive)}
                />
              </div>

              {/* Sub-cockpit panels for immediate driver context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Immediate Toll and Highway summary */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Cobro Vial de esta Ruta (IA)</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('calculator')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <span>Ver detalle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">TAG Electrónico:</span>
                      <span className="text-base font-bold text-cyan-300 font-mono-numbers">
                        {formatCLP(tollsData?.totalTagCost || 0)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-xs text-slate-400 block">Peajes Manuales:</span>
                      <span className="text-base font-bold text-purple-300 font-mono-numbers">
                        {formatCLP(tollsData?.totalManualTollsCost || 0)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-xs text-slate-400 block">Total Pórticos:</span>
                      <span className="text-base font-black text-white font-mono-numbers">
                        {tollsData?.tolls.length || 0}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {tollsData?.aiAdvice || 'Ruta calculada a través de autopistas concesionadas.'}
                  </p>
                </div>

                {/* Immediate Health Center & Gas Station Emergency widget */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Hospital className="w-4 h-4" />
                      <span>Centro Asistencial Más Cercano</span>
                    </span>
                    <a
                      href="tel:131"
                      className="text-xs px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
                    >
                      SAMU 131
                    </a>
                  </div>

                  {healthCenters[0] ? (
                    <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300">
                            {healthCenters[0].type}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[180px]">
                            {healthCenters[0].name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block truncate max-w-[220px]">
                          {healthCenters[0].address}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-cyan-400 font-mono-numbers">
                          A {healthCenters[0].distanceKm} km
                        </span>
                        <a
                          href={`tel:${healthCenters[0].phone}`}
                          className="text-[11px] text-rose-400 hover:underline block mt-0.5 font-medium"
                        >
                          Llamar
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Localizando centros de urgencia por GPS...</div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span>Estación más cercana: <strong className="text-amber-300">{gasStations[0]?.brand || 'Copec'}</strong> a {gasStations[0]?.distanceKm || 1.1} km</span>
                    <button
                      onClick={() => setActiveTab('gas')}
                      className="text-cyan-400 hover:underline"
                    >
                      Ver bencineras
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cost Calculator & TAG breakdown */}
          {activeTab === 'calculator' && (
            <div className="space-y-4">
              <CostCalculator
                tripInputs={tripInputs}
                onChangeInputs={handleUpdateInputs}
                routeDetails={routeDetails}
                tollsData={tollsData}
                loadingTolls={loadingTolls}
                onRecalculateTolls={() => calculateTolls(origin, destination, routeDetails?.distanceKm)}
              />

              {/* Map reference */}
              <div className="h-[320px] rounded-2xl overflow-hidden border border-slate-800">
                <NavigationMap
                  origin={origin}
                  destination={destination}
                  onRouteCalculated={handleRouteCalculated}
                  healthCenters={healthCenters}
                  gasStations={gasStations}
                  routeAlerts={routeAlerts}
                  selectedMarker={selectedMarker}
                  onSelectMarker={setSelectedMarker}
                  navigationModeActive={false}
                  onToggleNavigationMode={() => {}}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Health Centers (CESFAM, Postas, Hospitales) */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <HealthCentersPanel
                healthCenters={healthCenters}
                onSelectCenter={(center) => {
                  setSelectedMarker({ type: 'health', data: center });
                }}
                selectedId={selectedMarker?.type === 'health' ? selectedMarker.data.id : undefined}
              />

              <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-800">
                <NavigationMap
                  origin={origin}
                  destination={destination}
                  onRouteCalculated={handleRouteCalculated}
                  healthCenters={healthCenters}
                  gasStations={gasStations}
                  routeAlerts={routeAlerts}
                  selectedMarker={selectedMarker}
                  onSelectMarker={setSelectedMarker}
                  navigationModeActive={false}
                  onToggleNavigationMode={() => {}}
                />
              </div>
            </div>
          )}

          {/* Tab 4: Gas Stations */}
          {activeTab === 'gas' && (
            <div className="space-y-4">
              <GasStationsPanel
                gasStations={gasStations}
                onSelectStation={(station) => {
                  setSelectedMarker({ type: 'gas', data: station });
                }}
                selectedId={selectedMarker?.type === 'gas' ? selectedMarker.data.id : undefined}
              />

              <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-800">
                <NavigationMap
                  origin={origin}
                  destination={destination}
                  onRouteCalculated={handleRouteCalculated}
                  healthCenters={healthCenters}
                  gasStations={gasStations}
                  routeAlerts={routeAlerts}
                  selectedMarker={selectedMarker}
                  onSelectMarker={setSelectedMarker}
                  navigationModeActive={false}
                  onToggleNavigationMode={() => {}}
                />
              </div>
            </div>
          )}

          {/* Tab 5: Route Alerts and Incidents */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <RouteAlertsPanel
                alerts={routeAlerts}
                onSelectAlert={(al) => {
                  setSelectedMarker({ type: 'alert', data: al });
                }}
                onReportIncident={handleReportIncident}
                selectedId={selectedMarker?.type === 'alert' ? selectedMarker.data.id : undefined}
              />

              <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-800">
                <NavigationMap
                  origin={origin}
                  destination={destination}
                  onRouteCalculated={handleRouteCalculated}
                  healthCenters={healthCenters}
                  gasStations={gasStations}
                  routeAlerts={routeAlerts}
                  selectedMarker={selectedMarker}
                  onSelectMarker={setSelectedMarker}
                  navigationModeActive={false}
                  onToggleNavigationMode={() => {}}
                />
              </div>
            </div>
          )}
        </APIProvider>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          RutaGastos AI • Navegación con Google Maps Platform (Routes API & Places) & Gemini AI
        </p>
      </footer>
    </div>
  );
}
