import React, { useState } from 'react';
import {
  Navigation,
  Calculator,
  Hospital,
  Fuel,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Search,
  Sparkles,
  Route,
  Compass
} from 'lucide-react';

export type ActiveTab = 'navigator' | 'calculator' | 'health' | 'gas' | 'alerts';

interface HeaderProps {
  origin: string;
  destination: string;
  onChangeRoute: (origin: string, destination: string) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  alertCount: number;
}

export function Header({
  origin,
  destination,
  onChangeRoute,
  activeTab,
  onSelectTab,
  alertCount,
}: HeaderProps) {
  const [localOrigin, setLocalOrigin] = useState(origin);
  const [localDest, setLocalDest] = useState(destination);
  const [isSearching, setIsSearching] = useState(false);

  const handleApplyRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (localOrigin.trim() && localDest.trim()) {
      onChangeRoute(localOrigin.trim(), localDest.trim());
      setIsSearching(false);
    }
  };

  const presets = [
    { label: 'Stgo → Viña del Mar', o: 'Santiago Centro, Chile', d: 'Viña del Mar, Chile' },
    { label: 'Las Condes → Aeropuerto AMB', o: 'Las Condes, Santiago', d: 'Aeropuerto Internacional Arturo Merino Benítez, Pudahuel' },
    { label: 'Stgo → Rancagua', o: 'Santiago, Chile', d: 'Rancagua, O\'Higgins, Chile' },
    { label: 'Concepción → Los Ángeles', o: 'Concepción, Chile', d: 'Los Ángeles, Biobío, Chile' },
    { label: 'Valparaíso → La Serena', o: 'Valparaíso, Chile', d: 'La Serena, Coquimbo, Chile' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Top Brand Bar & Route Search Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Compass className="w-6 h-6 rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-black tracking-tight text-white">
                  RutaGastos<span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Navegador Vial
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Combustible, TAG & Peajes con IA • CESFAM, Hospitales y Bencineras GPS
              </p>
            </div>
          </div>

          {/* Current Corridor Badge / Search Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="max-w-[130px] md:max-w-[200px] truncate text-slate-300 font-semibold">
                {origin.split(',')[0]}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="max-w-[130px] md:max-w-[200px] truncate text-cyan-300 font-semibold">
                {destination.split(',')[0]}
              </span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Cambiar
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Route Selector Form & Quick Presets */}
        {isSearching && (
          <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 space-y-3">
            <form onSubmit={handleApplyRoute} className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
              <div className="md:col-span-5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Punto de Origen
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Santiago Centro, Las Condes, Maipú..."
                    value={localOrigin}
                    onChange={(e) => setLocalOrigin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Destino
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Viña del Mar, Aeropuerto Pudahuel, Rancagua..."
                    value={localDest}
                    onChange={(e) => setLocalDest(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-500/20"
                >
                  <Search className="w-4 h-4" />
                  <span>Trazar</span>
                </button>
              </div>
            </form>

            {/* Quick Route Presets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Rutas Frecuentes Sugeridas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setLocalOrigin(p.o);
                      setLocalDest(p.d);
                      onChangeRoute(p.o, p.d);
                      setIsSearching(false);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-white transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'navigator' as const, label: 'Navegador GPS', icon: Navigation },
            { id: 'calculator' as const, label: 'Gastos, TAG & Peajes', icon: Calculator },
            { id: 'health' as const, label: 'Centros de Salud (CESFAM)', icon: Hospital },
            { id: 'gas' as const, label: 'Bencineras Cercanas', icon: Fuel },
            {
              id: 'alerts' as const,
              label: 'Alertas en Ruta',
              icon: AlertTriangle,
              badge: alertCount > 0 ? alertCount : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-slate-950 text-cyan-300' : 'bg-red-600 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
