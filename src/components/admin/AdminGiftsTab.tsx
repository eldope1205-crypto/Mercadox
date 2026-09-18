import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminGiftsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminGiftsTab: React.FC<AdminGiftsTabProps> = ({ onNotify }) => {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGifts = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminGifts();
      setGifts(res.gifts);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar regalos solidarios', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGifts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Regalos Solidarios (0 €)</h2>
          <p className="text-xs text-slate-500">
            Supervisión de donaciones y transferencias gratuitas de artículos para evitar abusos o reventas fraudulentas.
          </p>
        </div>
        <button
          onClick={loadGifts}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Consultando regalos solidarios...</span>
          </div>
        ) : gifts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay publicaciones gratuitas registradas en la plataforma.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Artículo Solidario</th>
                  <th className="py-3 px-4">Donante</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Solicitudes Recibidas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gifts.map((g) => {
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={g.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 max-w-xs truncate">
                              {g.title}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ID: {g.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{g.giverName}</div>
                        <div className="text-[10px] text-slate-400">{g.giverMaskedEmail}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {g.approxLocation ? `${g.approxLocation.city} (${g.approxLocation.province})` : 'España'}
                      </td>

                      <td className="py-3 px-4 font-semibold text-indigo-700">
                        {g.requestsCount} persona(s) interesada(s)
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          g.giftStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.giftStatus === 'reserved'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {g.giftStatus === 'delivered' ? '✓ Entregado' : g.giftStatus === 'reserved' ? 'Reservado' : 'Disponible'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(g.createdAt).toLocaleDateString('es-ES')}
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
