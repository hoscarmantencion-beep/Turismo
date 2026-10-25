import React, { useState } from 'react';
import { GasStation } from '../types/index.ts';
import { Fuel, MapPin, Check, ArrowUpRight, DollarSign, Clock, ShieldCheck } from 'lucide-react';

interface GasStationsPanelProps {
  gasStations: GasStation[];
  onSelectStation: (station: GasStation) => void;
  selectedId?: string;
}

export function GasStationsPanel({
  gasStations,
  onSelectStation,
  selectedId,
}: GasStationsPanelProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [selectedFuelType, setSelectedFuelType] = useState<'gas93' | 'gas95' | 'gas97' | 'diesel'>('gas95');

  const filtered = gasStations.filter((gs) => {
    return selectedBrand === 'TODAS' || gs.brand === selectedBrand;
  });

  const getBrandBadgeColor = (brand: string) => {
    switch (brand) {
      case 'Copec':
        return 'bg-blue-950 border-blue-700 text-blue-300';
      case 'Shell':
        return 'bg-amber-950 border-amber-700 text-amber-300';
      case 'Petrobras':
        return 'bg-emerald-950 border-emerald-700 text-emerald-300';
      case 'Aramco':
        return 'bg-cyan-950 border-cyan-700 text-cyan-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Bombas de Bencina Cercanas</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300">
                Comparador
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Estaciones de servicio en ruta, precios por litro y servicios al conductor
            </p>
          </div>
        </div>

        {/* Quick Octane Selector for comparison */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Comparar:</span>
          {(['gas93', 'gas95', 'gas97', 'diesel'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFuelType(type)}
              className={`px-2 py-1 rounded-lg font-mono font-bold transition text-[11px] ${
                selectedFuelType === type
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'diesel' ? 'Diésel' : type.replace('gas', '') + ' Oct'}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['TODAS', 'Copec', 'Shell', 'Petrobras', 'Aramco'].map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
              selectedBrand === brand
                ? 'bg-amber-950 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Gas Stations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filtered.map((gs) => (
          <div
            key={gs.id}
            onClick={() => onSelectStation(gs)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
              selectedId === gs.id
                ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getBrandBadgeColor(
                    gs.brand
                  )}`}
                >
                  {gs.brand}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  A {gs.distanceKm} km
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                {gs.name}
              </h4>

              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="line-clamp-1">{gs.address}</span>
              </p>

              {/* Price comparison row */}
              <div className="grid grid-cols-4 gap-1.5 mt-2.5 p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">93</span>
                  <span className="text-xs font-bold text-slate-200">${gs.prices.gas93}</span>
                </div>
                <div className={selectedFuelType === 'gas95' ? 'bg-amber-950/50 rounded py-0.5 border border-amber-700/50' : ''}>
                  <span className="text-[10px] text-amber-400 block font-sans font-semibold">95</span>
                  <span className="text-xs font-bold text-amber-200">${gs.prices.gas95}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">97</span>
                  <span className="text-xs font-bold text-slate-200">${gs.prices.gas97}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Diésel</span>
                  <span className="text-xs font-bold text-slate-200">${gs.prices.diesel}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{gs.isOpen24Hours ? 'Abierto 24 Horas' : '07:00 a 23:00'}</span>
              </div>

              <button
                onClick={() => onSelectStation(gs)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1 text-[11px]"
              >
                <span>Ver en mapa</span>
                <ArrowUpRight className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
