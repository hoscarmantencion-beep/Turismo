import React, { useState } from 'react';
import { HealthCenter } from '../types/index.ts';
import { Hospital, Phone, MapPin, Clock, AlertCircle, HeartPulse, Filter, ArrowUpRight } from 'lucide-react';

interface HealthCentersPanelProps {
  healthCenters: HealthCenter[];
  onSelectCenter: (center: HealthCenter) => void;
  selectedId?: string;
}

export function HealthCentersPanel({
  healthCenters,
  onSelectCenter,
  selectedId,
}: HealthCentersPanelProps) {
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = healthCenters.filter((hc) => {
    const matchesType = filterType === 'TODOS' || hc.type === filterType;
    const matchesSearch =
      hc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hc.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Header with Emergency Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Red de Salud Pública Cercana</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
                GPS Activo
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Búsqueda automática de CESFAM, Postas Rurales, SAPU y Hospitales en tu radio
            </p>
          </div>
        </div>

        {/* Emergency Fast Dial SAMU 131 */}
        <a
          href="tel:131"
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/40 flex items-center gap-2 transition active:scale-95"
        >
          <Phone className="w-4 h-4" />
          <span>Llamar SAMU 131</span>
        </a>
      </div>

      {/* Filters: Category & Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o comuna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'HOSPITAL', label: 'Hospitales' },
            { id: 'CESFAM', label: 'CESFAM' },
            { id: 'POSTA', label: 'Postas' },
            { id: 'SAR', label: 'SAR/SAPU' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
                filterType === cat.id
                  ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Centers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
            No se encontraron centros de salud con los filtros actuales.
          </div>
        ) : (
          filtered.map((hc) => (
            <div
              key={hc.id}
              onClick={() => onSelectCenter(hc)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                selectedId === hc.id
                  ? 'bg-slate-800/90 border-rose-500 shadow-md ring-1 ring-rose-500'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      hc.type === 'HOSPITAL'
                        ? 'bg-rose-950 border border-rose-800 text-rose-300'
                        : hc.type === 'CESFAM'
                        ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                        : hc.type === 'POSTA'
                        ? 'bg-amber-950 border border-amber-800 text-amber-300'
                        : 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                    }`}
                  >
                    {hc.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    A {hc.distanceKm} km
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-1.5 leading-snug line-clamp-1">
                  {hc.name}
                </h4>

                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="line-clamp-1">{hc.address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{hc.hours}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${hc.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-700/60 transition"
                    title="Llamar teléfono de urgencia"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onSelectCenter(hc)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                    title="Ver en el mapa"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
