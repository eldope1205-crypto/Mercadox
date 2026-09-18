import React from 'react';
import { 
  ShieldCheck, Gift, ArrowRight, Sparkles, CheckCircle2, 
  HelpCircle, Lock, ShoppingBag, PlusCircle, Search 
} from 'lucide-react';
import { Product, Category, User, AdminSettings } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';
import { CategoryBar } from '../components/CategoryBar.js';

interface HomeViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onProductClick: (productId: string) => void;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  settings: AdminSettings | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  favorites,
  onToggleFavorite,
  onProductClick,
  onNavigate,
  currentUser,
  onOpenAuth,
  settings
}) => {
  const featuredProducts = products.filter(p => p.isFeatured && p.status === 'active');
  const regularProducts = products.filter(p => !p.isGift && p.status === 'active');
  const giftProducts = products.filter(p => p.isGift && (p.status === 'active' || p.status === 'gift_reserved'));

  return (
    <div className="space-y-8 pb-16">
      
      {/* Category Scroller */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Original Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>MercadoX · Marketplace seguro entre particulares en España</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight">
              Compra, vende y regala con total <span className="text-indigo-400">seguridad y transparencia</span>.
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Sin transferencias dudosas fuera de la web. Protección activa contra estafas por Bizum, pagos retenidos hasta la entrega y sección dedicada para regalar objetos solidarios.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('browse')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar catálogo</span>
              </button>

              <button
                onClick={() => onNavigate('gifts')}
                className="px-5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>🎁 Regala gratis (0 €)</span>
              </button>

              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else onNavigate('sell');
                }}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer border border-white/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Vender un producto</span>
              </button>
            </div>
          </div>

          {/* Decorative geometric accent */}
          <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Featured Products (If any exist) */}
        {featuredProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  Publicaciones destacadas
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onProductClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                {selectedCategory ? 'Productos en esta categoría' : 'Productos recientes'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Artículos reales publicados por particulares. Precios transparentes y sin cargos ocultos.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('browse')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {regularProducts.length === 0 ? (
            /* Clean Empty State - Strictly NO fake data */
            <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-heading">
                Todavía no hay productos publicados en esta sección
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                MercadoX opera exclusivamente con anuncios y transacciones reales de usuarios. Sé el primero en publicar un producto para la comunidad en España.
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else onNavigate('sell');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar el primer anuncio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularProducts.slice(0, 8).map(product => (
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
        </section>

        {/* 🎁 REGALA GRATIS Section Preview */}
        <section className="space-y-4 p-6 sm:p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                <Gift className="w-3.5 h-3.5 text-emerald-700" />
                <span>Economía Circular · 0 € Sin Comisión</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                🎁 Regala gratis
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                ¿Tienes cosas en casa que ya no usas y quieres que alguien las aproveche? En MercadoX puedes regalarlas gratuitamente a otros particulares.
              </p>
            </div>

            <button
              onClick={() => onNavigate('gifts')}
              className="self-start sm:self-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Ver todos los regalos (0 €)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {giftProducts.length === 0 ? (
            <div className="text-center py-8 bg-white/80 rounded-xl border border-emerald-100 p-4">
              <p className="text-xs text-slate-600">
                Aún no hay objetos publicados para regalar gratis. ¡Anímate a regalar algo que no uses!
              </p>
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth();
                  else onNavigate('sell');
                }}
                className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Publicar un regalo gratuito (0 €)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
              {giftProducts.slice(0, 4).map(product => (
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
        </section>

        {/* How It Works Section */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Cómo funciona MercadoX
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Un entorno protegido para particulares con reglas claras y honestas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Compra y pago protegido</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El dinero del comprador se retiene en custodia segura dentro de la plataforma hasta que recibes el producto y confirmas su estado.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Ventas con cobro garantizado</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comisión transparente del {settings?.commissionPercent || 8}% solo cuando la venta se completa. Sabrás exactamente qué importe neto recibes antes de enviar.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Regala sin coste</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Publica a 0 € lo que ya no utilices. Gestiona solicitudes de personas interesadas y entrega en mano de forma solidaria sin ninguna comisión.
              </p>
            </div>
          </div>
        </section>

        {/* Anti-Fraud Security Commitment */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Compromiso de Seguridad Activa</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-heading">
              Nunca realices pagos ni transferencias fuera de MercadoX
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nuestro chat interno detecta automáticamente solicitudes de pago por Bizum, enlaces externos o transferencias directas para avisarte de posibles fraudes.
            </p>
          </div>

          <button
            onClick={() => onNavigate('seguridad')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            Leer consejos antifraude
          </button>
        </section>

      </div>
    </div>
  );
};
