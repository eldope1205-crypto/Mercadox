import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, ShieldAlert, Save, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminCommissionsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminCommissionsTab: React.FC<AdminCommissionsTabProps> = ({ onNotify, onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    commissionRate: number;
    totalCommissions: number;
    totalVolume: number;
    breakdown: any[];
  }>({
    commissionRate: 8,
    totalCommissions: 0,
    totalVolume: 0,
    breakdown: []
  });

  const [newRate, setNewRate] = useState<number>(8);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCommissions();
      setData(res);
      setNewRate(res.commissionRate);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar comisiones', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      onNotify('Debes justificar el motivo para registrarlo en la auditoría inmutable.', true);
      return;
    }
    setUpdating(true);
    try {
      await api.updateAdminSettings({
        commissionPercent: newRate
      });
      onNotify(`Porcentaje de comisión actualizado a ${newRate}% y registrado en auditoría.`);
      setShowEditModal(false);
      setReason('');
      loadCommissions();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar comisión', true);
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Commission Rate Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Política Financiera de MercadoX
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 font-heading">
            Comisión actual: <span className="text-indigo-600 font-mono text-2xl">{data.commissionRate} %</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Esta tarifa se aplica automáticamente a todas las ventas protegidas gestionadas mediante depósito en custodia. Toda modificación queda registrada de forma inmutable en el registro de auditoría.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Percent className="w-4 h-4" />
            <span>Modificar Comisión</span>
          </button>
          <button
            onClick={loadCommissions}
            className="p-2.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Total Comisiones Generadas</div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {formatPrice(data.totalCommissions)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Ingresos netos directos de plataforma
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Volumen Total Transaccionado</div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {formatPrice(data.totalVolume)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            En operaciones protegidas de marketplace
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Operaciones con Comisión</div>
          <div className="text-2xl font-black text-indigo-600 font-heading">
            {data.breakdown.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Ventas no canceladas ni reembolsadas
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Desglose de Comisiones por Pedido ({data.breakdown.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Calculado en tiempo real sobre ventas completadas
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando desglose de comisiones...</div>
        ) : data.breakdown.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se han registrado transacciones comerciales aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Pedido</th>
                  <th className="py-2.5 px-4">Artículo</th>
                  <th className="py-2.5 px-4">Comprador / Vendedor</th>
                  <th className="py-2.5 px-4">Importe Venta</th>
                  <th className="py-2.5 px-4">Tasa Aplicada</th>
                  <th className="py-2.5 px-4">Comisión Cobrada</th>
                  <th className="py-2.5 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.breakdown.map((item) => (
                  <tr key={item.orderId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-900">
                      {item.orderId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.productTitle}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{item.buyerName}</div>
                      <div className="text-[10px] text-slate-400">Vendedor: {item.sellerName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatPrice(item.orderPrice)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.commissionRate} %
                    </td>
                    <td className="py-3 px-4 font-extrabold text-indigo-700">
                      +{formatPrice(item.commissionAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Commission Modal with Mandatory Audit Justification */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Modificar Porcentaje de Comisión
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La nueva comisión se aplicará a todas las ventas posteriores.
              </p>
            </div>

            <form onSubmit={handleUpdateCommission} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nuevo porcentaje de comisión (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-indigo-600 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tarifa estándar recomendada: entre 5% y 10%.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo obligatorio para la auditoría:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique el motivo del cambio (ej: Promoción de lanzamiento de primavera, ajuste por costes de pasarela, etc.)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Esta acción quedará registrada en el registro inmutable de auditoría con su cuenta de administrador, fecha, IP y motivo.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updating ? 'Guardando...' : 'Confirmar y Auditar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
