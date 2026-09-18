import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, RefreshCw, Lock, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminPaymentsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({ onNotify }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ stripeConfigured: boolean; payments: any[] }>({
    stripeConfigured: false,
    payments: []
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPayments();
      setData(res);
    } catch (err: any) {
      onNotify(err.message || 'Error al obtener registro de pagos', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Pasarela de Pagos y Liquidaciones</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro exclusivo de transacciones confirmadas en la pasarela de pagos oficial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            data.stripeConfigured 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {data.stripeConfigured ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stripe Conectado</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Proveedor de pagos pendiente de configuración</span>
              </>
            )}
          </div>
          <button
            onClick={loadPayments}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gateway Notice if not configured */}
      {!data.stripeConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Proveedor de pagos pendiente de configuración</span>
          </div>
          <p className="leading-relaxed">
            Para habilitar el procesamiento automatizado en producción con tarjeta bancaria, Apple Pay y Google Pay, declare las claves en las variables de entorno del servidor:
          </p>
          <div className="font-mono bg-amber-100/70 p-2.5 rounded-xl text-[11px] text-amber-950 space-y-1">
            <div>STRIPE_SECRET_KEY=sk_live_...</div>
            <div>STRIPE_PUBLISHABLE_KEY=pk_live_...</div>
            <div>STRIPE_WEBHOOK_SECRET=whsec_...</div>
          </div>
          <p className="text-[11px] text-amber-800">
            MercadoX no inventa pagos simulados ni números de ejemplo. En este entorno, las transacciones se gestionan con el sistema de custodia protegido nativo.
          </p>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Pagos Confirmados ({data.payments.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Solo pedidos con fondos verificados en custodia
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando pagos confirmados...</div>
        ) : data.payments.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No hay cobros confirmados registrados</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {data.stripeConfigured 
                ? 'Los cobros aparecerán aquí una vez que los compradores completen pedidos con tarjeta.'
                : 'Proveedor de pagos pendiente de configuración.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">ID Transacción</th>
                  <th className="py-2.5 px-4">Pedido / Artículo</th>
                  <th className="py-2.5 px-4">Comprador</th>
                  <th className="py-2.5 px-4">Método</th>
                  <th className="py-2.5 px-4">Importe</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.payments.map((p) => (
                  <tr key={p.orderId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-900">
                      {p.transactionId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.productTitle}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Ref: {p.orderId}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.buyerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Confirmado
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(p.paidAt || p.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
