import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Calendar, DollarSign, RefreshCw, Eye } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminPromotionsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminPromotionsTab: React.FC<AdminPromotionsTabProps> = ({ onNotify }) => {
  const [data, setData] = useState<{
    pricing: { featuredPrice7Days: number; featuredPrice30Days: number };
    promotedProducts: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [p7, setP7] = useState(4.99);
  const [p30, setP30] = useState(14.99);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPromotions();
      setData(res);
      if (res?.pricing) {
        setP7(res.pricing.featuredPrice7Days);
        setP30(res.pricing.featuredPrice30Days);
      }
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar promociones', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSettings({
        featuredPrice7Days: p7,
        featuredPrice30Days: p30
      });
      onNotify('Tarifas de anuncios destacados actualizadas correctamente.');
      loadPromotions();
    } catch (err: any) {
      onNotify(err.message || 'Error al actualizar tarifas de promoción', true);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Gestión de Promociones y Visibilidad Destacada</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tarifas de visibilidad extra e inventario de anuncios impulsados por vendedores.
          </p>
        </div>
        <button
          onClick={loadPromotions}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refrescar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Pricing Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-indigo-600" />
          <span>Configurar Tarifas Oficiales de Promoción</span>
        </h3>

        <form onSubmit={handleUpdatePricing} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Impulso 7 Días (€):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.99"
              value={p7}
              onChange={(e) => setP7(parseFloat(e.target.value) || 0)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Impulso 30 Días (€):
            </label>
            <input
              type="number"
              step="0.01"
              min="1.99"
              value={p30}
              onChange={(e) => setP30(parseFloat(e.target.value) || 0)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {saving ? 'Guardando...' : 'Actualizar Tarifas'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Promoted Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Anuncios con Visibilidad Extra ({data?.promotedProducts?.length || 0})
          </h3>
          <span className="text-[11px] text-slate-400">
            Campañas contratadas por usuarios
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Cargando anuncios destacados...</div>
        ) : !data?.promotedProducts?.length ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Actualmente no hay anuncios con impulso promocional activo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Producto</th>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Tipo de Promoción</th>
                  <th className="py-2.5 px-4">Fecha Inicio</th>
                  <th className="py-2.5 px-4">Fecha Fin</th>
                  <th className="py-2.5 px-4">Ingreso Generado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.promotedProducts.map((p: any) => {
                  const duration = p.featuredDays || 7;
                  const estimatedIncome = duration === 30 ? (data.pricing?.featuredPrice30Days || 14.99) : (data.pricing?.featuredPrice7Days || 4.99);
                  const startDate = p.featuredStartedAt ? new Date(p.featuredStartedAt).toLocaleDateString('es-ES') : new Date(p.createdAt).toLocaleDateString('es-ES');
                  const endDate = p.featuredUntil ? new Date(p.featuredUntil).toLocaleDateString('es-ES') : 'En curso';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.id} · {formatPrice(p.price)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.sellerName || 'Vendedor'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.sellerId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                          ⭐ Destacado {duration} días
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {startDate}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {endDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                        +{formatPrice(estimatedIncome)}
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
