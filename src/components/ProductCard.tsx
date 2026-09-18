import React from 'react';
import { Heart, MapPin, CheckCircle, Sparkles, Gift } from 'lucide-react';
import { Product } from '../types.js';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onClick: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onClick
}) => {
  const conditionLabels: Record<string, string> = {
    new: 'Nuevo a estrenar',
    like_new: 'Como nuevo',
    good: 'En buen estado',
    fair: 'Aceptable'
  };

  const isGift = product.isGift || product.price === 0;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onClick(product.id)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite heart button */}
        <button
          onClick={(e) => onToggleFavorite(e, product.id)}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-xs backdrop-blur-xs transition-colors z-10"
          title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'
            }`} 
          />
        </button>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Destacado
            </span>
          )}

          {isGift && (
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
              <Gift className="w-3 h-3" />
              0 € GRATIS
            </span>
          )}

          {product.status === 'gift_reserved' && (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Reservado
            </span>
          )}

          {product.status === 'sold' && (
            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Vendido
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline justify-between gap-2">
            <span className={`font-extrabold tracking-tight ${isGift ? 'text-emerald-700 text-base' : 'text-slate-900 text-lg'}`}>
              {isGift ? '0 € · Regalo solidario' : `${product.price.toLocaleString('es-ES')} €`}
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate">
              {conditionLabels[product.condition] || 'Buen estado'}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>
        </div>

        {/* Location & Seller Verification */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[60%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{product.approxLocation.city}</span>
          </div>

          {product.sellerVerification === 'identity_verified' ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold text-[10px]">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Verificado</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">Particular</span>
          )}
        </div>
      </div>
    </div>
  );
};
