import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, CheckCircle2, Clock, Scale, 
  Star, AlertCircle, ExternalLink, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Order, User } from '../types.js';
import { RatingModal } from '../components/RatingModal.js';
import { DisputeModal } from '../components/DisputeModal.js';

interface OrdersViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  onOpenAuth,
  onNavigate
}) => {
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const [orders, setOrders] = useState<{ purchases: Order[]; sales: Order[] }>({ purchases: [], sales: [] });
  const [loading, setLoading] = useState(true);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<Order | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState<{ [orderId: string]: string }>({});

  const fetchOrders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getMyOrders();
      setOrders(res);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleUpdateStatus = async (orderId: string, status: string, trackingNum?: string) => {
    try {
      await api.updateOrderStatus(orderId, status, trackingNum);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado del pedido.');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Inicia sesión para consultar tus pedidos</h2>
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  const currentList = tab === 'purchases' ? orders.purchases : orders.sales;

  const statusLabels: Record<string, { label: string; color: string }> = {
    payment_pending: { label: 'Pago pendiente', color: 'bg-amber-100 text-amber-800' },
    payment_confirmed: { label: 'Pago protegido confirmado', color: 'bg-blue-100 text-blue-800' },
    preparing_shipment: { label: 'En preparación', color: 'bg-indigo-100 text-indigo-800' },
    shipped: { label: 'Enviado por paquetería', color: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: 'Entregado al comprador', color: 'bg-teal-100 text-teal-800' },
    completed: { label: 'Completado con éxito', color: 'bg-emerald-100 text-emerald-800' },
    in_dispute: { label: 'En disputa / Revisión', color: 'bg-rose-100 text-rose-800' },
    refunded: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800' },
    cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-700' }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
          Gestión de Pedidos y Transacciones
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control de envíos, pagos en custodia, valoraciones y resolución de incidencias.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('purchases')}
          className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            tab === 'purchases'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Mis compras ({orders.purchases.length})
        </button>

        <button
          onClick={() => setTab('sales')}
          className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            tab === 'sales'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Mis ventas ({orders.sales.length})
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Cargando pedidos...
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No tienes {tab === 'purchases' ? 'compras registradas' : 'ventas registradas'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === 'purchases' 
              ? 'Explora productos de particulares y compra con total protección de pagos.' 
              : 'Publica tus productos y gestiona aquí los pedidos y envíos.'}
          </p>
          <button
            onClick={() => onNavigate(tab === 'purchases' ? 'browse' : 'sell')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            {tab === 'purchases' ? 'Explorar catálogo' : 'Publicar anuncio'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(order => {
            const statusConfig = statusLabels[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' };

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">Pedido #{order.id}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 items-center">
                    <img
                      src={order.productImage || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&q=80'}
                      alt={order.productTitle}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">{order.productTitle}</h3>
                      <p className="text-[11px] text-slate-500">
                        {tab === 'purchases' ? `Vendedor: ${order.sellerName}` : `Comprador: ${order.buyerName}`}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Seguimiento: {order.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing Breakdown for Buyer / Seller */}
                  <div className="text-right text-xs space-y-0.5">
                    {tab === 'purchases' ? (
                      <>
                        <span className="text-slate-400 text-[11px] block">Total pagado</span>
                        <span className="text-base font-extrabold text-slate-900">{order.amount.toFixed(2)} €</span>
                        <span className="text-[10px] text-slate-400 block">Incluye artículo, envío y protección</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 text-[11px] block">Ingreso neto para ti</span>
                        <span className="text-base font-extrabold text-emerald-700">{order.sellerAmount.toFixed(2)} €</span>
                        <span className="text-[10px] text-slate-400 block">Comisión {order.commissionAmount.toFixed(2)} € deducida</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delivery Address Note */}
                {order.shippingAddress && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-0.5">
                    <span className="font-semibold text-slate-700 block">Dirección de entrega:</span>
                    <p>{order.shippingAddress.fullName} · {order.shippingAddress.street ? `${order.shippingAddress.street}, ` : ''}{order.shippingAddress.postalCode} {order.shippingAddress.city} ({order.shippingAddress.province})</p>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  
                  {/* Left sub-actions (Chat, Dispute) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('product', order.productId)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Ver producto
                    </button>

                    {order.status !== 'completed' && order.status !== 'in_dispute' && (
                      <button
                        onClick={() => setSelectedOrderForDispute(order)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Abrir disputa</span>
                      </button>
                    )}
                  </div>

                  {/* Right Status Advancement Buttons */}
                  <div className="flex items-center gap-2">
                    
                    {/* Seller actions: Mark shipped */}
                    {tab === 'sales' && (order.status === 'payment_confirmed' || order.status === 'payment_pending' || order.status === 'preparing_shipment') && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nº de seguimiento (opcional)"
                          value={trackingNumberInput[order.id] || ''}
                          onChange={(e) => setTrackingNumberInput({ ...trackingNumberInput, [order.id]: e.target.value })}
                          className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg"
                        />
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'shipped', trackingNumberInput[order.id])}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Marcar como enviado
                        </button>
                      </div>
                    )}

                    {/* Buyer actions: Confirm delivered */}
                    {tab === 'purchases' && order.status === 'shipped' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Confirmar que lo he recibido
                      </button>
                    )}

                    {/* Buyer actions: Finalize & Release payout */}
                    {tab === 'purchases' && order.status === 'delivered' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Todo correcto (Liberar pago al vendedor)
                      </button>
                    )}

                    {/* Rate transaction - Only when completed */}
                    {order.status === 'completed' && !order.ratingId && (
                      <button
                        onClick={() => setSelectedOrderForRating(order)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Valorar transacción</span>
                      </button>
                    )}

                    {order.status === 'completed' && order.ratingId && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valoración completada</span>
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {selectedOrderForRating && (
        <RatingModal
          isOpen={true}
          onClose={() => setSelectedOrderForRating(null)}
          order={selectedOrderForRating}
          onSuccess={() => {
            setSelectedOrderForRating(null);
            fetchOrders();
          }}
        />
      )}

      {/* Dispute Modal */}
      {selectedOrderForDispute && (
        <DisputeModal
          isOpen={true}
          onClose={() => setSelectedOrderForDispute(null)}
          order={selectedOrderForDispute}
          onSuccess={() => {
            setSelectedOrderForDispute(null);
            fetchOrders();
          }}
        />
      )}

    </div>
  );
};
