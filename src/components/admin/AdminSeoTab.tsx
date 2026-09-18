import React, { useState, useEffect } from 'react';
import { Globe, Search, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminSeoTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminSeoTab: React.FC<AdminSeoTabProps> = ({ onNotify }) => {
  const [seo, setSeo] = useState<any>({
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    keywords: '',
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/',
    sitemapEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSeo = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSEO();
      setSeo({
        metaTitle: res.seo.metaTitle || 'MercadoX · Compra, Venta y Regalo Seguro en España',
        metaDescription: res.seo.metaDescription || 'Marketplace de confianza en España con pagos protegidos y regalos solidarios.',
        ogImage: res.seo.ogImage || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&auto=format&fit=crop&q=80',
        keywords: res.seo.keywords || 'segunda mano, comprar, vender, regalos gratis, pagos protegidos, espana',
        robotsTxt: res.seo.robotsTxt || 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/',
        sitemapEnabled: res.seo.sitemapEnabled !== false
      });
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar SEO', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSEO(seo);
      onNotify('Configuración SEO y metaetiquetas actualizada.');
    } catch (err: any) {
      onNotify(err.message || 'Error al guardar SEO', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Configuración SEO y Presencia en Redes</h2>
          <p className="text-xs text-slate-500">
            Etiquetas Open Graph, Schema.org estructurado, robots.txt y personalización del snippet en buscadores.
          </p>
        </div>
        <button
          onClick={loadSeo}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Título Principal (&lt;title&gt;):
              </label>
              <input
                type="text"
                value={seo.metaTitle}
                onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Descripción (Buscadores):
              </label>
              <textarea
                value={seo.metaDescription}
                onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                rows={3}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Palabras Clave (separadas por coma):
              </label>
              <input
                type="text"
                value={seo.keywords}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                URL Imagen Social (og:image):
              </label>
              <input
                type="url"
                value={seo.ogImage}
                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Configuración robots.txt:
              </label>
              <textarea
                value={seo.robotsTxt}
                onChange={(e) => setSeo({ ...seo, robotsTxt: e.target.value })}
                rows={4}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="sitemapToggle"
                checked={seo.sitemapEnabled}
                onChange={(e) => setSeo({ ...seo, sitemapEnabled: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <label htmlFor="sitemapToggle" className="font-semibold text-slate-700 cursor-pointer">
                Generar mapa del sitio XML dinámico (/sitemap.xml)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Guardando...' : 'Guardar Parámetros SEO'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Search & Social Snippet Preview */}
        <div className="space-y-4">
          {/* Google Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Vista previa en Google</span>
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-sans space-y-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>https://mercadox.es</span>
                <span>›</span>
              </div>
              <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
                {seo.metaTitle || 'Título no especificado'}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2">
                {seo.metaDescription || 'Descripción no definida en el panel.'}
              </div>
            </div>
          </div>

          {/* Open Graph Card Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Tarjeta Open Graph / Redes Sociales</span>
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              {seo.ogImage && (
                <img
                  src={seo.ogImage}
                  alt="OG Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-3 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400">mercadox.es</span>
                <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {seo.metaTitle}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {seo.metaDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
