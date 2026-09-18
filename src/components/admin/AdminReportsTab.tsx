import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminReportsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ onNotify }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReports();
      setReports(res.reports);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar reportes', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (resolution: 'action_taken' | 'dismissed') => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await api.resolveReport(selectedReport.id, resolution, resolutionNotes);
      onNotify(`Reporte marcado como "${resolution === 'action_taken' ? 'Medidas tomadas' : 'Descartado'}".`);
      setSelectedReport(null);
      setResolutionNotes('');
      loadReports();
    } catch (err: any) {
      onNotify(err.message || 'Error al procesar reporte', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Cola de Denuncias y Reportes</h2>
          <p className="text-xs text-slate-500">
            Revisión de advertencias enviadas por la comunidad sobre artículos, perfiles o mensajes inapropiados.
          </p>
        </div>
        <button
          onClick={loadReports}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No hay reportes pendientes de moderación en la cola.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tipo / Objeto</th>
                  <th className="py-3 px-4">Motivo de Denuncia</th>
                  <th className="py-3 px-4">Denunciante</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map((r) => {
                  const isPending = r.status === 'pending';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                          {r.targetType}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {r.targetId?.substring(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-rose-700">
                        {r.reason}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {r.reporterName || 'Usuario anónimo'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.description || 'Sin comentarios adicionales'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.status === 'action_taken'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'dismissed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.status === 'action_taken' ? '✓ Medidas tomadas' : r.status === 'dismissed' ? 'Descartado' : 'Pendiente'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => { setSelectedReport(r); setResolutionNotes(''); }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                          >
                            Resolver
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Archivado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Tramitar Reporte #{selectedReport.id.substring(0, 8)}
              </h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div><strong>Objeto denunciado:</strong> {selectedReport.targetType} ({selectedReport.targetId})</div>
              <div><strong>Motivo:</strong> <span className="font-bold text-rose-700">{selectedReport.reason}</span></div>
              <div><strong>Explicación denunciante:</strong> {selectedReport.description}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Justificación de la resolución (Auditado):
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Indica las comprobaciones o acciones realizadas..."
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleResolve('dismissed')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Descartar Reporte
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleResolve('action_taken')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                Confirmar Medidas Tomadas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
