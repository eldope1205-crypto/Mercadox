import React, { useState, useEffect } from 'react';
import { 
  Gift, HeartHandshake, CheckCircle2, XCircle, 
  Clock, Package, PlusCircle, ArrowRight, UserCheck 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Product, GiftRequest, User } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';

interface GiftsViewProps {
  products: Product[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onProductClick: (id: string) => void;
  onNavigate: (view: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
}

export const GiftsView: React.FC<GiftsViewProps> = ({
  products,
  currentUser,
  onOpenAuth,
  onProductClick,
  onNavigate,
  favorites,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'requests'>('browse');
  const [requests, setRequests] = useState<{ sent: GiftRequest[]; received: GiftRequest[] }>({ sent: [], received: [] });
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const giftProducts = products.filter(p => p.isGift || p.price === 0);

  const fetchRequests = async () => {
    if (!currentUser) return;
    setLoadingRequests(true);
    try {
      const res = await api.getGiftRequests();
      setRequests(res);
    } catch (err: any) {
      console.error('Error fetching gift requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests' && currentUser) {
      fetchRequests();
    }
  }, [activeTab, currentUser]);

  const handleAction = async (requestId: string, action: 'accept' | 'reject' | 'deliver' | 'cancel') => {
    setActionInProgress(requestId);
    try {
      await api.actionGiftRequest(requestId, action);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la solicitud.');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Banner for Gifts */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-emerald-800 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>MercadoX Solidario · 0 € Sin costes</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
            Regala gratis y dale una <span className="text-emerald-400">segunda vida</span> a lo que no usas.
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Una iniciativa de economía circular comunitaria en España. Si tienes muebles, ropa, libros o tecnología funcionando que ya no necesitas, regálalos sin comisiones ni intermediarios.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigate('sell');
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar un regalo gratuito (0 €)</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none p-6 hidden md:block">
          <HeartHandshake className="w-64 h-64 text-emerald-300" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'browse'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Regalos disponibles ({giftProducts.filter(p => p.status === 'active').length})
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Mis solicitudes de regalo ({requests.received.length + requests.sent.length})
          </button>
        )}
      </div>

      {/* Tab: Browse Gifts */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {giftProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <Gift className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-heading">
                Aún no hay regalos gratuitos activos
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                MercadoX no inserta artículos falsos. Si tienes cualquier cosa en buen estado en casa, ¡sé el primero en regalarla!
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else onNavigate('sell');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Publicar un regalo gratis (0 €)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {giftProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onProductClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: My Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-8">
          
          {/* Requests Received on My Gifts */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Solicitudes recibidas para mis regalos ({requests.received.length})</span>
            </h2>

            {requests.received.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                No tienes solicitudes pendientes de otros usuarios para tus regalos.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.received.map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.requesterName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                          req.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'accepted' ? 'Aceptada (Reservado)' :
                           req.status === 'delivered' ? 'Entregado con éxito' :
                           req.status === 'rejected' ? 'Rechazada' : 'Pendiente de tu respuesta'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        Producto: <span className="text-indigo-600">{req.productTitle}</span>
                      </p>
                      {req.message && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(req.id, 'accept')}
                            disabled={actionInProgress === req.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Aceptar y reservar
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={actionInProgress === req.id}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </>
                      )}

                      {req.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleAction(req.id, 'deliver')}
                            disabled={actionInProgress === req.id}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Marcar como entregado
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'cancel')}
                            disabled={actionInProgress === req.id}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar reserva
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requests Sent By Me */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Solicitudes que he enviado ({requests.sent.length})</span>
            </h2>

            {requests.sent.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                No has solicitado ningún regalo todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.sent.map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.productTitle}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                          req.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'accepted' ? '¡Aceptada! Ponte en contacto con el dueño' :
                           req.status === 'delivered' ? 'Entregado' :
                           req.status === 'rejected' ? 'No aceptada' : 'Esperando respuesta'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Solicitado el {new Date(req.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <button
                      onClick={() => onProductClick(req.productId)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Ver producto
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
