import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, AlertTriangle, CheckCircle2, 
  Ban, Pause, Play, Trash2, Eye, DollarSign, Gift 
} from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminProductsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ onNotify }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts({
          categoryId: selectedCategory || undefined,
          status: selectedStatus || undefined,
          search: search || undefined
        }),
        api.getAdminCategories()
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar productos', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleProductAction = async (productId: string, action: string) => {
    setActionLoading(true);
    try {
      await api.adminProductAction(productId, action, moderationReason);
      onNotify(`Acción "${action}" aplicada al producto.`);
      setSelectedProduct(null);
      setModerationReason('');
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al moderar producto', true);
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Moderación de Catálogo y Artículos</h2>
          <p className="text-xs text-slate-500">
            Revisión de anuncios, artículos prohibidos, productos en revisión y control de publicaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="under_review">En revisión</option>
            <option value="paused">Pausados</option>
            <option value="sold">Vendidos</option>
            <option value="gift_delivered">Donados</option>
            <option value="blocked">Bloqueados</option>
          </select>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Buscar título o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs py-1.5 px-3 w-40 sm:w-48 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              Filtrar
            </button>
          </form>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Consultando catálogo...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay productos que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Precio / Tipo</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Reportes</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const isBlocked = p.status === 'blocked';
                  const isPaused = p.status === 'paused';
                  const isReview = p.status === 'under_review';
                  const pendingReports = p.reportsCount || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 max-w-xs truncate">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {p.categoryName || 'General'} · ID: {p.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.isGift ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            <Gift className="w-3 h-3" /> Regalo gratis
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900 text-xs">
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{p.sellerName || 'Vendedor'}</div>
                        <div className="text-[10px] text-slate-400">{p.sellerMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : isReview
                            ? 'bg-amber-100 text-amber-800'
                            : isPaused
                            ? 'bg-slate-100 text-slate-700'
                            : p.status === 'sold' || p.status === 'gift_delivered'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.status === 'active' ? '✓ Activo' : p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {pendingReports > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" /> {pendingReports} denuncia(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">0 denuncias</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          id={`admin-product-action-${p.id}`}
                          onClick={() => setSelectedProduct(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Gestionar
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

      {/* Product Action Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 truncate pr-4">
                Moderar: {selectedProduct.title}
              </h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src={selectedProduct.images?.[0]} 
                  alt="" 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900">{selectedProduct.title}</div>
                  <div className="text-slate-500">{selectedProduct.description?.substring(0, 100)}...</div>
                </div>
              </div>
              <div><strong>Vendedor:</strong> {selectedProduct.sellerName} ({selectedProduct.sellerMaskedEmail})</div>
              <div><strong>Estado actual:</strong> {selectedProduct.status}</div>
              <div><strong>Fecha publicación:</strong> {new Date(selectedProduct.createdAt).toLocaleDateString('es-ES')}</div>
            </div>

            {/* Audit Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo de la acción de moderación (Auditado):
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Ejemplo: Infracción de normas de artículos no permitidos, solicitud del vendedor..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>

              {selectedProduct.status !== 'active' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProductAction(selectedProduct.id, 'reactivate')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Reactivar Anuncio
                </button>
              )}

              {selectedProduct.status === 'active' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProductAction(selectedProduct.id, 'pause')}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" /> Ocultar / Pausar
                </button>
              )}

              {selectedProduct.status !== 'sold' && !selectedProduct.isGift && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProductAction(selectedProduct.id, 'mark_sold')}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer"
                >
                  Marcar Vendido
                </button>
              )}

              {selectedProduct.status !== 'blocked' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProductAction(selectedProduct.id, 'block')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Ban className="w-3 h-3" /> Bloquear Artículo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
