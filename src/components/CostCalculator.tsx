import React, { useState } from 'react';
import { TripInputs, TollsCalculationResult, RouteDetails } from '../types/index.ts';
import {
  Calculator,
  Fuel,
  CreditCard,
  Users,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Info,
  Car,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers
} from 'lucide-react';

interface CostCalculatorProps {
  tripInputs: TripInputs;
  onChangeInputs: (updated: Partial<TripInputs>) => void;
  routeDetails: RouteDetails | null;
  tollsData: TollsCalculationResult | null;
  loadingTolls: boolean;
  onRecalculateTolls: () => void;
}

export function CostCalculator({
  tripInputs,
  onChangeInputs,
  routeDetails,
  tollsData,
  loadingTolls,
  onRecalculateTolls,
}: CostCalculatorProps) {
  const [showTollList, setShowTollList] = useState(true);

  // Calculations
  const distanceKm = routeDetails?.distanceKm || 35;
  const litersConsumed = distanceKm / Math.max(1, tripInputs.fuelConsumptionKmPerL);
  const fuelTotalCost = Math.round(litersConsumed * tripInputs.fuelPricePerLiter);

  const tagCost = tollsData?.totalTagCost ?? 0;
  const manualTollsCost = tollsData?.totalManualTollsCost ?? 0;
  const totalTollsCost = tollsData?.totalTollsCost ?? (tagCost + manualTollsCost);

  const grandTotalCost = fuelTotalCost + totalTollsCost;
  const costPerPassenger = Math.round(grandTotalCost / Math.max(1, tripInputs.numPassengers));

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Header with Title and AI Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Calculadora de Gastos & TAG</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Gemini AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Combustible manual + Peajes y pórticos TAG calculados automáticamente por IA
            </p>
          </div>
        </div>

        <button
          onClick={onRecalculateTolls}
          disabled={loadingTolls}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loadingTolls ? 'animate-spin' : ''}`} />
          <span>{loadingTolls ? 'Calculando con IA...' : 'Recalcular Peajes'}</span>
        </button>
      </div>

      {/* Main Highlights Card: Grand Total & Per-Person Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Costo Total */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
            Gasto Total del Viaje
          </span>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono-numbers">
            {formatCLP(grandTotalCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Combustible + TAG + Peajes
          </span>
        </div>

        {/* Costo por Pasajero */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block mb-1">
              Por Pasajero
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono">
              {tripInputs.numPassengers} {tripInputs.numPassengers === 1 ? 'persona' : 'personas'}
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-blue-200 font-mono-numbers">
            {formatCLP(costPerPassenger)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            División equitativa de gastos
          </span>
        </div>

        {/* Combustible Total */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1 flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" />
            Combustible
          </span>
          <div className="text-xl font-bold text-amber-200 font-mono-numbers">
            {formatCLP(fuelTotalCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono-numbers">
            {litersConsumed.toFixed(1)} L a ${tripInputs.fuelPricePerLiter}/L
          </span>
        </div>

        {/* Peajes & TAG Total */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 block mb-1 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Total TAG y Peajes
          </span>
          <div className="text-xl font-bold text-purple-200 font-mono-numbers">
            {formatCLP(totalTollsCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono-numbers">
            TAG: {formatCLP(tagCost)} | Peaje: {formatCLP(manualTollsCost)}
          </span>
        </div>
      </div>

      {/* Manual Configuration Inputs Section */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Parámetros de Vehículo y Combustible</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Configuración Manual</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rendimiento del Combustible */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-slate-300">Rendimiento (km/L):</label>
              <span className="font-mono-numbers font-bold text-cyan-400 text-sm">
                {tripInputs.fuelConsumptionKmPerL.toFixed(1)} km/L
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="28"
              step="0.5"
              value={tripInputs.fuelConsumptionKmPerL}
              onChange={(e) => onChangeInputs({ fuelConsumptionKmPerL: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[
                { label: 'Ciudad', val: 9.0 },
                { label: 'Mixto', val: 12.0 },
                { label: 'Carretera', val: 16.0 },
                { label: 'Híbrido', val: 21.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onChangeInputs({ fuelConsumptionKmPerL: p.val })}
                  className={`py-1 text-[10px] font-medium rounded border transition ${
                    Math.abs(tripInputs.fuelConsumptionKmPerL - p.val) < 0.2
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label} ({p.val})
                </button>
              ))}
            </div>
          </div>

          {/* Precio del Combustible */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-slate-300">Precio Combustible ($/L):</label>
              <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                ${tripInputs.fuelPricePerLiter}
              </span>
            </div>
            <input
              type="number"
              min="600"
              max="2500"
              step="10"
              value={tripInputs.fuelPricePerLiter}
              onChange={(e) => onChangeInputs({ fuelPricePerLiter: parseInt(e.target.value) || 1200 })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono-numbers text-white focus:outline-none focus:border-amber-400"
            />
            {/* Quick Fuel Selectors */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[
                { type: '93', price: 1240 },
                { type: '95', price: 1295 },
                { type: '97', price: 1350 },
                { type: 'Diésel', price: 980 },
              ].map((f) => (
                <button
                  key={f.type}
                  onClick={() => onChangeInputs({ fuelPricePerLiter: f.price })}
                  className={`py-1 text-[10px] font-medium rounded border transition ${
                    tripInputs.fuelPricePerLiter === f.price
                      ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.type} (${f.price})
                </button>
              ))}
            </div>
          </div>

          {/* Pasajeros y Tipo de Día */}
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pasajeros a bordo:</span>
                </label>
                <span className="font-bold text-blue-300">{tripInputs.numPassengers}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => onChangeInputs({ numPassengers: n })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${
                      tripInputs.numPassengers === n
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Día de viaje (impacta tarifas TAG):</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'habil', label: 'Día Hábil' },
                  { id: 'fin_de_semana', label: 'Fin de Semana' },
                  { id: 'festivo', label: 'Festivo' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onChangeInputs({ dayType: d.id as any })}
                    className={`py-1 text-[10px] font-medium rounded border transition ${
                      tripInputs.dayType === d.id
                        ? 'bg-purple-950 border-purple-600 text-purple-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Advice and Highway Corridor Info */}
      {tollsData && (
        <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-cyan-300">Análisis Inteligente de Ruta:</span>
              {tollsData.highways.map((hw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-medium"
                >
                  {hw}
                </span>
              ))}
            </div>
            <p className="text-slate-300 leading-relaxed">{tollsData.aiAdvice}</p>
          </div>
        </div>
      )}

      {/* Detailed Tolls and TAG Gates Breakdown */}
      {tollsData && tollsData.tolls.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          <button
            onClick={() => setShowTollList(!showTollList)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-850 transition"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Desglose de Pórticos TAG y Plazas de Peaje ({tollsData.tolls.length} detectados)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTollList ? 'rotate-180' : ''}`} />
          </button>

          {showTollList && (
            <div className="divide-y divide-slate-800/80 p-1">
              {tollsData.tolls.map((toll, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{toll.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            toll.type === 'tag_electronico'
                              ? 'bg-blue-950 border border-blue-800 text-blue-300'
                              : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          }`}
                        >
                          {toll.type === 'tag_electronico' ? 'TAG FreeFlow' : 'Peaje Troncal'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {toll.highway} {toll.notes ? `• ${toll.notes}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-white font-mono-numbers text-sm block">
                      {formatCLP(toll.estimatedCost)}
                    </span>
                    {toll.peakHourSurcharge && (
                      <span className="text-[9px] text-amber-400 uppercase font-semibold">Horario Punta</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
