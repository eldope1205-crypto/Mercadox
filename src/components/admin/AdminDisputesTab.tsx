import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, XCircle, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminDisputesTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminDisputesTab: React.FC<AdminDisputesTabProps> = ({ onNotify }) => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminDisputes();
      setDisputes(res.disputes);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar disputas', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleResolve = async (resolution: 'resolved_buyer' | 'resolved_seller' | 'closed') => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      await api.resolveDispute(selectedDispute.id, resolution, resolutionNotes);
      const text = resolution === 'resolved_buyer' 
        ? 'Resuelta a favor del comprador (reembolso emitido)' 
        : resolution === 'resolved_seller' 
        ? 'Resuelta a favor del vendedor (fondos liberados)' 
        : 'Disputa cerrada';
      onNotify(text);
      setSelectedDispute(null);
      setResolutionNotes('');
      loadDisputes();
    } catch (err: any) {
      onNotify(err.message || 'Error al resolver disputa', true);
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
          <h2 className="text-sm font-bold text-slate-900">Mediación de Disputas Comerciales</h2>
          <p className="text-xs text-slate-500">
            Resolución de reclamaciones sobre transacciones con retención de fondos en custodia.
          </p>
        </div>
        <button
          onClick={loadDisputes}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando disputas...</div>
        ) : disputes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No hay disputas comerciales abiertas en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pedido / Artículo</th>
                  <th className="py-3 px-4">Importe en Custodia</th>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Motivo Disputa</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {disputes.map((d) => {
                  const isOpen = d.status === 'open' || d.status === 'under_review';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{d.productTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Pedido #{d.orderId?.substring(0, 8)}</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(d.orderAmount)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{d.buyerName}</div>
                        <div className="text-[10px] text-slate-400">{d.buyerMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{d.sellerName}</div>
                        <div className="text-[10px] text-slate-400">{d.sellerMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-rose-700">
                        {d.reason}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          d.status === 'resolved_buyer'
                            ? 'bg-blue-50 text-blue-700'
                            : d.status === 'resolved_seller'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {d.status === 'resolved_buyer' ? 'Reembolsado a Comprador' : d.status === 'resolved_seller' ? 'Liberado a Vendedor' : 'Abierta'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isOpen ? (
                          <button
                            onClick={() => { setSelectedDispute(d); setResolutionNotes(d.resolutionNotes || ''); }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                          >
                            Arbitrar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Cerrada</span>
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

      {/* Mediation Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Arbitraje de Disputa #{selectedDispute.id.substring(0, 8)}
              </h3>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
              <div><strong>Artículo:</strong> {selectedDispute.productTitle}</div>
              <div><strong>Importe en custodia:</strong> <span className="font-bold text-slate-900">{formatPrice(selectedDispute.orderAmount)}</span></div>
              <div><strong>Motivo:</strong> {selectedDispute.reason}</div>
              <div><strong>Descripción reclamante:</strong> {selectedDispute.description}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dictamen y Justificación de Arbitraje (Auditado):
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Indica la resolución del caso y las evidencias aportadas por las partes..."
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleResolve('resolved_buyer')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                Reembolsar al Comprador
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleResolve('resolved_seller')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                Liberar al Vendedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
