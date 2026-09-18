import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminOrdersTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ onNotify }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrders();
      setOrders(res.orders);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar ventas y pedidos', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Ventas, Pedidos y Comisiones</h2>
          <p className="text-xs text-slate-500">
            Registro contable de transacciones reales con retención de custodia y comisiones de plataforma.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Consultando transacciones...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se han registrado pedidos en la plataforma todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Importe</th>
                  <th className="py-3 px-4">Comisión MercadoX</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => {
                  const isCompleted = o.status === 'completed' || o.status === 'delivered';
                  const isDispute = o.status === 'in_dispute';

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        #{o.id.substring(0, 8)}
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(o.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 max-w-xs truncate">
                          {o.productTitle || 'Artículo'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ID: {o.productId?.substring(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{o.buyerName || 'Comprador'}</div>
                        <div className="text-[10px] text-slate-400">{o.buyerMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{o.sellerName || 'Vendedor'}</div>
                        <div className="text-[10px] text-slate-400">{o.sellerMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPrice(o.amount)}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatPrice(o.commissionAmount || o.amount * 0.08)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : isDispute
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {o.status === 'completed' ? '✓ Completado' : o.status === 'in_dispute' ? '⚖ En disputa' : o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
