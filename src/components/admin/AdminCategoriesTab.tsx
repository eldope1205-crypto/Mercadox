import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminCategoriesTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({ onNotify }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    iconName: 'Package',
    description: '',
    orderIndex: 0,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCategories();
      setCategories(res.categories);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar categorías', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      iconName: 'Package',
      description: '',
      orderIndex: categories.length + 1,
      isActive: true
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName || 'Package',
      description: cat.description || '',
      orderIndex: cat.orderIndex || 0,
      isActive: cat.isActive !== false
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        onNotify('Categoría actualizada con éxito.');
      } else {
        await api.createCategory(formData);
        onNotify('Nueva categoría creada con éxito.');
      }
      setEditModalOpen(false);
      loadCategories();
    } catch (err: any) {
      onNotify(err.message || 'Error al guardar categoría', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Solo se permite si no tiene productos asociados.`)) {
      return;
    }
    try {
      await api.deleteCategory(cat.id);
      onNotify('Categoría eliminada.');
      loadCategories();
    } catch (err: any) {
      onNotify(err.message || 'Error al eliminar categoría', true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Estructura y Taxonomía de Categorías</h2>
          <p className="text-xs text-slate-500">
            Administración del catálogo, slugs amigables para posicionamiento y orden de visualización.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCategories}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No hay categorías configuradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Orden</th>
                  <th className="py-3 px-4">Nombre / Icono</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #{c.orderIndex}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">{c.iconName}</span>
                      <span>{c.name}</span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      /{c.slug}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {c.description}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.isActive !== false ? 'Activa' : 'Oculta'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit / Create */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCategory ? `Editar Categoría: ${editingCategory.name}` : 'Crear Nueva Categoría'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug URL (sin espacios):</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de icono Lucide:</label>
                <input
                  type="text"
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  placeholder="Smartphone, Shirt, Home, Car, Package..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Posición orden:</label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700">Visible en catálogo</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
