import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminPayoutsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminPayoutsTab: React.FC<AdminPayoutsTabProps> = ({ onNotify }) => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [operationId, setOperationId] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPayouts();
      setPayouts(res.payouts);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar retiradas', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedPayout) return;
    setActionLoading(true);
    try {
      await api.updateAdminPayoutStatus(selectedPayout.id, newStatus, operationId, note);
      onNotify(`Retirada ${selectedPayout.id} actualizada a "${newStatus}".`);
      setSelectedPayout(null);
      setOperationId('');
      setNote('');
      loadPayouts();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar retirada', true);
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p || 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Solicitudes de Retirada y Liquidaciones</h2>
          <p className="text-xs text-slate-500">
            Control de transferencias bancarias SEPA hacia vendedores tras ventas confirmadas.
          </p>
        </div>
        <button
          onClick={loadPayouts}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Consultando transferencias...</span>
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay solicitudes de retirada registradas en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Importe</th>
                  <th className="py-3 px-4">IBAN Destino</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Ref. Bancaria</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payouts.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isRejected = p.status === 'rejected';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        #{p.id.substring(0, 8)}
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(p.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.sellerName || 'Vendedor'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.sellerId?.substring(0, 8)}...</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(p.amount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {p.ibanMasked || 'ES** **** **** **** ****'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.status === 'completed' ? '✓ Liquidado' : p.status === 'rejected' ? 'Rechazado' : p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-slate-500">
                        {p.operationId || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          id={`admin-payout-action-${p.id}`}
                          onClick={() => { setSelectedPayout(p); setOperationId(p.operationId || ''); setNote(p.holdReason || ''); }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Tramitar
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

      {/* Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Tramitar Retirada #{selectedPayout.id.substring(0, 8)}
              </h3>
              <button onClick={() => setSelectedPayout(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div><strong>Vendedor:</strong> {selectedPayout.sellerName}</div>
              <div><strong>Importe a transferir:</strong> <span className="font-bold text-slate-900">{formatPrice(selectedPayout.amount)}</span></div>
              <div><strong>IBAN Destino:</strong> <span className="font-mono">{selectedPayout.ibanMasked}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID de Operación / Ref. Bancaria SEPA:
              </label>
              <input
                type="text"
                value={operationId}
                onChange={(e) => setOperationId(e.target.value)}
                placeholder="Ej. SEPA-TX-2026-99384"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas / Motivo de retención o rechazo:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Indica motivos si se retiene o rechaza la liquidación..."
                rows={2}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('under_review')}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer"
              >
                Retener / En revisión
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('rejected')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
              >
                Rechazar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('completed')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                Marcar como Pagado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
