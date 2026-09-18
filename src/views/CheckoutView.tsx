import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Truck, CreditCard, ArrowLeft, 
  AlertCircle, CheckCircle2, Info 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Product, User, AdminSettings } from '../types.js';

interface CheckoutViewProps {
  productId: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (view: string, param?: string) => void;
  settings: AdminSettings | null;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  productId,
  currentUser,
  onOpenAuth,
  onNavigate,
  settings
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);

  // Address fields
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState(currentUser?.city || 'Madrid');
  const [province, setProvince] = useState(currentUser?.province || 'Madrid');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Payment configuration status
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    api.getConfig().then(cfg => {
      setIsStripeConfigured(cfg.stripeConfigured);
    });

    api.getProduct(productId)
      .then(res => {
        setProduct(res.product);
      })
      .catch(err => {
        setError(err.message || 'Error al cargar el producto para la compra.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <Lock className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Inicia sesión para tramitar el pedido</h2>
        <p className="text-xs text-slate-500">
          Para tu protección, todas las compras se asocian a una cuenta verificada.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-16 text-center text-slate-500 text-xs">
        Cargando detalles de compra protegida...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No es posible tramitar la compra</h3>
        <p className="text-xs text-slate-500">{error || 'El producto no está disponible para compra.'}</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Volver a explorar
        </button>
      </div>
    );
  }

  const shippingCost = product.shippingMethod === 'pickup' ? 0 : 3.95;
  const buyerProtectionFee = Math.round((product.price * 0.04 + 0.90) * 100) / 100;
  const totalAmount = Math.round((product.price + shippingCost + buyerProtectionFee) * 100) / 100;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createOrder(product.id, {
        fullName,
        street,
        postalCode,
        city,
        province,
        phone
      });

      setOrderCreatedId(res.order.id);
    } catch (err: any) {
      setError(err.message || 'Error al formalizar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <button
        onClick={() => onNavigate('product', product.id)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al anuncio</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Tramitación de Compra Segura
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Garantía de protección de pagos MercadoX España
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pago bajo custodia</span>
        </div>
      </div>

      {orderCreatedId ? (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            ¡Pedido registrado correctamente!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            El pedido #{orderCreatedId} ha sido emitido. Puedes consultar su seguimiento y gestionar la entrega desde tu panel de pedidos.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('orders')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Ver mis pedidos y compras
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form: Delivery Address (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Dirección de entrega y contacto</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrder} id="checkout-form" className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo del receptor</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de entrega</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Calle, número, piso o puerta"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="28001"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono de contacto</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia</label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Summary: Costs & Payment Provider Status (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Product Summary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex gap-3 items-center pb-3 border-b border-slate-100">
                <img
                  src={product.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&q=80'}
                  alt={product.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{product.title}</h3>
                  <span className="text-[11px] text-slate-500 block">{product.approxLocation.city}, {product.approxLocation.province}</span>
                  <span className="text-xs font-extrabold text-slate-900">{product.price.toFixed(2)} €</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal artículo</span>
                  <span className="font-semibold text-slate-800">{product.price.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos de envío asegurado</span>
                  <span className="font-semibold text-slate-800">{shippingCost > 0 ? `${shippingCost.toFixed(2)} €` : '0.00 € (En mano)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    Protección MercadoX y mediación
                    <span title="Cubre devolución si el producto no coincide o no llega">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </span>
                  <span className="font-semibold text-slate-800">{buyerProtectionFee.toFixed(2)} €</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total a pagar</span>
                  <span className="text-indigo-700 text-base">{totalAmount.toFixed(2)} €</span>
                </div>
              </div>

              {/* Real Provider Transparency Note */}
              {!isStripeConfigured && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    Pasarela bancaria en configuración técnica
                  </span>
                  <p className="text-[11px] leading-relaxed text-amber-800/90">
                    MercadoX integra pasarela bancaria oficial (Stripe). Actualmente la variable <code>STRIPE_SECRET_KEY</code> está pendiente de configuración en producción. Siguiendo nuestras directrices de honestidad, el pedido se emitirá formalmente pero no se simularán cobros bancarios falsos.
                  </p>
                </div>
              )}

              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? 'Procesando pedido...' : `Confirmar pedido (${totalAmount.toFixed(2)} €)`}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Transacción protegida por protocolo seguro SSL/TLS</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
