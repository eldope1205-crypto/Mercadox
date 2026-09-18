import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Lock, 
  MessageSquare, Eye, RefreshCw, XCircle, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminSecurityTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({ onNotify }) => {
  const [overview, setOverview] = useState<any>(null);
  const [flaggedMessages, setFlaggedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSecurityOverview();
      setOverview(res);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar seguridad', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleOpenFlaggedMessages = async () => {
    setShowMessagesModal(true);
    setLoadingMessages(true);
    try {
      const res = await api.getAdminFlaggedMessages();
      setFlaggedMessages(res.flaggedMessages);
    } catch (err: any) {
      onNotify(err.message || 'Error al consultar mensajes reportados', true);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUpdateAlert = async (status: string) => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await api.updateAdminAlertStatus(selectedAlert.id, status, resolutionNotes);
      onNotify(`Alerta actualizada a "${status}".`);
      setSelectedAlert(null);
      setResolutionNotes('');
      loadOverview();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar alerta', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Centro de Seguridad Antifraude y Alertas de Riesgo</span>
          </h2>
          <p className="text-xs text-slate-500">
            Detección automática de estafas, pagos fuera de plataforma, suplantación y cuentas bajo sospecha.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFlaggedMessages}
            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mensajes sospechosos ({overview?.flaggedMessagesCount || 0})</span>
          </button>
          <button
            onClick={loadOverview}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Alerts Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Alertas de Seguridad en Tiempo Real ({overview?.alerts?.length || 0})
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Cargando alertas de seguridad...
          </div>
        ) : !overview?.alerts?.length ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay alertas de seguridad registradas en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Severidad</th>
                  <th className="py-2.5 px-4">Alerta / Incidencia</th>
                  <th className="py-2.5 px-4">Tipo de Señal</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {overview.alerts.map((al: any) => {
                  const isCrit = al.severity === 'critical';
                  const isHigh = al.severity === 'high';
                  const isMed = al.severity === 'medium';

                  return (
                    <tr key={al.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800'
                            : isHigh
                            ? 'bg-orange-100 text-orange-800'
                            : isMed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {isCrit ? '🔴 Crítico' : isHigh ? '🟠 Alto' : isMed ? '🟡 Medio' : '🔵 Info'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{al.title}</div>
                        <div className="text-[11px] text-slate-500 max-w-md">{al.description}</div>
                        {al.relatedUserName && (
                          <div className="text-[10px] text-indigo-600 mt-0.5">
                            Usuario: {al.relatedUserName}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {al.signalType}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          al.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : al.status === 'under_review'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {al.status === 'resolved' ? '✓ Resuelto' : al.status === 'under_review' ? 'En revisión' : 'Nuevo'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(al.createdAt).toLocaleDateString('es-ES')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => { setSelectedAlert(al); setResolutionNotes(al.resolutionNotes || ''); }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                        >
                          Resolver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flagged Messages Modal */}
      {showMessagesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mensajes Marcados por Detección Antifraude
                </h3>
                <p className="text-[11px] text-slate-500">
                  Acceso restringido auditado en servidor. Solo mensajes con coincidencias de pago externo o estafa.
                </p>
              </div>
              <button onClick={() => setShowMessagesModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingMessages ? (
                <div className="py-8 text-center text-slate-500 text-xs">Analizando registros de chat...</div>
              ) : flaggedMessages.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No hay mensajes marcados como sospechosos actualmente.
                </div>
              ) : (
                flaggedMessages.map((m) => (
                  <div key={m.id} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-medium text-slate-700">
                      <span>De: <strong>{m.senderName}</strong> ({m.senderMaskedEmail})</span>
                      <span className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleString('es-ES')}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-200/60 text-slate-900 font-mono text-[11px]">
                      "{m.text}"
                    </div>
                    <div className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                      <span>Patrones detectados:</span>
                      <span>{m.detectedPatterns?.join(', ') || 'Pago externo'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 shrink-0">
              <button
                onClick={() => setShowMessagesModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Gestionar Alerta: {selectedAlert.title}
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div><strong>Descripción:</strong> {selectedAlert.description}</div>
              <div><strong>Señal:</strong> <span className="font-mono">{selectedAlert.signalType}</span></div>
              <div><strong>Severidad:</strong> {selectedAlert.severity}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas de Resolución / Medidas Tomadas:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Ejemplo: Cuenta del infractor suspendida tras comprobar intento de pago externo..."
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleUpdateAlert('under_review')}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer"
              >
                En Investigación
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleUpdateAlert('resolved')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                Marcar Resuelto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
