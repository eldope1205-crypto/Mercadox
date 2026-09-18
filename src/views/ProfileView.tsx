import React, { useState } from 'react';
import { 
  User as UserIcon, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, Package, PlusCircle, Trash2, Edit 
} from 'lucide-react';
import { User, Product } from '../types.js';
import { VerificationModal } from '../components/VerificationModal.js';
import { ProductCard } from '../components/ProductCard.js';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  userProducts: Product[];
  onUserUpdated: (user: User) => void;
  onNavigate: (view: string, param?: string) => void;
  onDeleteProduct: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  userProducts,
  onUserUpdated,
  onNavigate,
  onDeleteProduct,
  favorites,
  onToggleFavorite
}) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Inicia sesión para ver tu perfil</h2>
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-heading">{currentUser.name}</h1>
              {currentUser.verificationLevel === 'identity_verified' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Identidad verificada</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
              </span>
              {currentUser.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.city} ({currentUser.province})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Trigger Button */}
        <button
          onClick={() => setShowVerificationModal(true)}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/80 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Niveles de verificación y confianza</span>
        </button>
      </div>

      {/* Published Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Mis productos anunciados ({userProducts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Gestiona los anuncios que tienes activos o regalas actualmente.
            </p>
          </div>

          <button
            onClick={() => onNavigate('sell')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Publicar otro anuncio</span>
          </button>
        </div>

        {userProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No tienes productos activos en este momento.</p>
            <button
              onClick={() => onNavigate('sell')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Publicar un artículo ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {userProducts.map(prod => (
              <div key={prod.id} className="relative group">
                <ProductCard
                  product={prod}
                  isFavorite={favorites.includes(prod.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={(id) => onNavigate('product', id)}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Estás seguro de eliminar este anuncio?')) {
                      onDeleteProduct(prod.id);
                    }
                  }}
                  className="absolute bottom-3 right-3 p-1.5 bg-white/90 hover:bg-rose-600 hover:text-white text-slate-600 rounded-lg shadow-xs transition-colors border border-slate-200 z-10"
                  title="Eliminar anuncio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />

    </div>
  );
};
