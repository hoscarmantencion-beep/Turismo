import React, { useState } from 'react';
import { RouteAlert } from '../types/index.ts';
import {
  AlertTriangle,
  Flame,
  Truck,
  Wrench,
  ShieldAlert,
  Clock,
  PlusCircle,
  CheckCircle2,
  Send,
  MapPin,
  Sparkles
} from 'lucide-react';

interface RouteAlertsPanelProps {
  alerts: RouteAlert[];
  onSelectAlert: (alert: RouteAlert) => void;
  onReportIncident: (newAlert: Partial<RouteAlert>) => Promise<void>;
  selectedId?: string;
}

export function RouteAlertsPanel({
  alerts,
  onSelectAlert,
  onReportIncident,
  selectedId,
}: RouteAlertsPanelProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<RouteAlert['type']>('accidente');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportHighway, setReportHighway] = useState('Autopista Central');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    setSubmitting(true);
    try {
      await onReportIncident({
        type: reportType,
        title: reportTitle,
        description: reportDescription || 'Reporte de incidente verificado por conductor en ruta.',
        highwayOrStreet: reportHighway,
        severity: reportType === 'accidente' ? 'alta' : 'moderada',
      });
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getAlertIcon = (type: RouteAlert['type']) => {
    switch (type) {
      case 'accidente':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'obras':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'congestion':
        return <Truck className="w-5 h-5 text-yellow-400" />;
      case 'animales':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'radar_policia':
        return <ShieldAlert className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  const getSeverityBadge = (severity: RouteAlert['severity']) => {
    switch (severity) {
      case 'critica':
        return 'bg-red-950 border-red-700 text-red-300 font-bold';
      case 'alta':
        return 'bg-rose-950 border-rose-700 text-rose-300';
      case 'moderada':
        return 'bg-amber-950 border-amber-700 text-amber-300';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Sucesos y Alertas en Ruta</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300">
                En Tiempo Real
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Accidentes, obras viales, congestión vehicular y peligros en tu trazado
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/40 flex items-center gap-1.5 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Reportar Suceso</span>
        </button>
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {alerts.map((al) => (
          <div
            key={al.id}
            onClick={() => onSelectAlert(al)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
              selectedId === al.id
                ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getSeverityBadge(
                    al.severity
                  )}`}
                >
                  Severidad {al.severity}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  A {al.distanceFromHereKm} km
                </span>
              </div>

              <div className="flex items-start gap-2.5 mt-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  {getAlertIcon(al.type)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {al.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {al.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-slate-300">{al.highwayOrStreet}</span>
                <span>•</span>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{al.timestamp}</span>
              </div>

              <button
                onClick={() => onSelectAlert(al)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition text-[11px]"
              >
                Localizar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-5 bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-950 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Reportar Suceso en la Ruta</h4>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tipo de Suceso:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'accidente', label: 'Accidente' },
                    { id: 'obras', label: 'Obras Viales' },
                    { id: 'congestion', label: 'Congestión' },
                    { id: 'animales', label: 'Animal en vía' },
                    { id: 'radar_policia', label: 'Control Policial' },
                    { id: 'clima', label: 'Neblina / Lluvia' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setReportType(t.id as any)}
                      className={`p-2 rounded-lg border text-center transition ${
                        reportType === t.id
                          ? 'bg-red-950 border-red-600 text-red-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Título del Reporte:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Choque en pista derecha, poste caído, pista cerrada..."
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Carretera o Autopista:</label>
                <input
                  type="text"
                  value={reportHighway}
                  onChange={(e) => setReportHighway(e.target.value)}
                  placeholder="Ej: Ruta 68, Autopista Central km 22, Vespucio Sur..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Detalle o recomendación (Opcional):</label>
                <textarea
                  rows={2}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Indica si hay desvío disponible o si el tránsito está completamente detenido..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reportTitle.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Enviando...' : 'Publicar Alerta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
