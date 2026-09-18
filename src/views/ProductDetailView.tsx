import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Heart, MapPin, CheckCircle, Share2, 
  Flag, MessageSquare, ShoppingBag, Gift, Truck, 
  User as UserIcon, Star, ArrowLeft, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Product, Rating, User } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';
import { ReportModal } from '../components/ReportModal.js';

interface ProductDetailViewProps {
  productId: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (view: string, param?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  currentUser,
  onOpenAuth,
  onNavigate,
  isFavorite,
  onToggleFavorite
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Gift request state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [requestingGift, setRequestingGift] = useState(false);
  const [giftSuccessMsg, setGiftSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api.getProduct(productId)
      .then(res => {
        if (!mounted) return;
        setProduct(res.product);
        setSeller(res.seller);
        setRelatedProducts(res.relatedProducts);
        setActiveImageIndex(0);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message || 'Error al cargar el producto.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  // Inject SEO Schema.org JSON-LD dynamically
  useEffect(() => {
    if (!product) return;
    const scriptId = 'product-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': product.title,
      'image': product.images,
      'description': product.description,
      'offers': {
        '@type': 'Offer',
        'priceCurrency': 'EUR',
        'price': product.price,
        'itemCondition': product.condition === 'new' 
          ? 'https://schema.org/NewCondition' 
          : 'https://schema.org/UsedCondition',
        'availability': product.status === 'active' 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock'
      }
    };
    script.text = JSON.stringify(schema);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Cargando detalles del producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">No se ha podido encontrar el producto</h2>
        <p className="text-xs text-slate-500">{error || 'El anuncio ha sido retirado o ya no está disponible.'}</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  const isGift = product.isGift || product.price === 0;
  const isOwner = currentUser?.id === product.sellerId;

  const handleStartChat = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.startConversation(product.id);
      onNavigate('chat', res.conversation.id);
    } catch (err: any) {
      alert(err.message || 'Error al iniciar conversación.');
    }
  };

  const handleSendGiftRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setRequestingGift(true);
    try {
      const res = await api.requestGift(product.id, giftMessage);
      setGiftSuccessMsg(res.message);
      setTimeout(() => {
        setShowGiftModal(false);
        setGiftSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Error al enviar solicitud.');
    } finally {
      setRequestingGift(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Back button */}
      <button
        onClick={() => onNavigate('browse')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la búsqueda</span>
      </button>

      {/* Main product view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Images (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
            <img
              src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'}
              alt={product.title}
              className="w-full h-full object-contain bg-slate-50"
            />
            {isGift && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                0 € · Regalo solidario
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-indigo-600 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Descripción del producto</h2>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {product.description}
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Estado</span>
                <span className="font-semibold text-slate-800">
                  {product.condition === 'new' ? 'Nuevo a estrenar' : product.condition === 'like_new' ? 'Como nuevo' : product.condition === 'good' ? 'En buen estado' : 'Aceptable'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Entrega</span>
                <span className="font-semibold text-slate-800">
                  {product.shippingMethod === 'both' ? 'En mano o Envío' : product.shippingMethod === 'shipping' ? 'Solo envío' : 'Solo en mano'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ubicación</span>
                <span className="font-semibold text-slate-800">{product.approxLocation.city}, {product.approxLocation.province}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Details & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main Price & Title card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight block ${
                  isGift ? 'text-emerald-700' : 'text-slate-900'
                }`}>
                  {isGift ? '0 € GRATIS' : `${product.price.toLocaleString('es-ES')} €`}
                </span>
                {isGift && (
                  <span className="text-xs font-semibold text-emerald-600 block mt-0.5">
                    Regalo sin ningún tipo de pago ni comisión
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => onToggleFavorite(e, product.id)}
                  className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  title="Guardar en favoritos"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                  title="Reportar anuncio"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 font-heading leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{product.approxLocation.city}, {product.approxLocation.province}</span>
              <span>·</span>
              <span>Publicado {new Date(product.createdAt).toLocaleDateString('es-ES')}</span>
            </div>

            {/* Action buttons */}
            <div className="pt-3 space-y-2.5">
              {isOwner ? (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 text-center font-semibold">
                  Este anuncio es tuyo. Puedes gestionarlo desde tu perfil.
                </div>
              ) : isGift ? (
                /* Gift Request Button */
                <button
                  onClick={() => {
                    if (!currentUser) onOpenAuth();
                    else setShowGiftModal(true);
                  }}
                  disabled={product.status === 'gift_reserved'}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {product.status === 'gift_reserved' ? 'Regalo reservado para otro usuario' : '🎁 Quiero este producto gratis'}
                  </span>
                </button>
              ) : (
                /* Regular Buy & Chat Buttons */
                <>
                  <button
                    onClick={() => {
                      if (!currentUser) onOpenAuth();
                      else onNavigate('checkout', product.id);
                    }}
                    disabled={product.status !== 'active'}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{product.status === 'active' ? 'Comprar de forma segura' : 'Producto no disponible'}</span>
                  </button>

                  <button
                    onClick={handleStartChat}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-600" />
                    <span>Contactar con el vendedor</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Antifraud Guarantee Box */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Garantía MercadoX y Prevención Antifraude</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              No realices transferencias fuera de MercadoX ni aceptes Bizum de desconocidos. Los pagos integrados en MercadoX retienen el importe en una cuenta de custodia legal hasta que recibes y compruebas el producto.
            </p>
          </div>

          {/* Seller Card */}
          {seller && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Datos del vendedor
              </span>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                  {seller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{seller.name}</span>
                    {seller.verificationLevel === 'identity_verified' && (
                      <span title="Identidad verificada">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    En MercadoX desde {new Date(seller.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Real verified stats - Strictly no fake reviews */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Ventas completadas</span>
                  <span className="font-bold text-slate-800">{seller.totalCompletedSales}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Valoraciones reales</span>
                  {seller.totalRatings > 0 ? (
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{seller.ratingAverage.toFixed(1)} ({seller.totalRatings})</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Sin reseñas aún</span>
                  )}
                </div>
              </div>

              {/* Seller ratings list if any */}
              {seller.ratings && seller.ratings.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Últimas valoraciones</span>
                  {seller.ratings.slice(0, 2).map((r: Rating) => (
                    <div key={r.id} className="text-xs bg-slate-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      {r.comment && <p className="text-[11px] text-slate-600 mt-1 italic">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
            Productos similares en la misma categoría
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                isFavorite={false}
                onToggleFavorite={onToggleFavorite}
                onClick={(id) => onNavigate('product', id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="product"
        targetId={product.id}
        targetName={product.title}
      />

      {/* Gift Request Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-heading mb-1 flex items-center gap-2 text-emerald-700">
              <Gift className="w-5 h-5 text-emerald-600" />
              <span>Solicitar regalo gratis (0 €)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Envía un mensaje educado al propietario explicando por qué te interesa y cuándo podrías recogerlo o recibirlo.
            </p>

            {giftSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-semibold">
                ✓ {giftSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSendGiftRequest} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Hola, me interesa mucho este regalo porque... Puedo recogerlo en mano o acordar el envío."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGiftModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={requestingGift}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {requestingGift ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
