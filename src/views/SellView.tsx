import React, { useState } from 'react';
import { 
  Upload, Plus, X, Sparkles, Gift, DollarSign, 
  MapPin, ShieldCheck, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Category, Product, User, AdminSettings } from '../types.js';

interface SellViewProps {
  categories: Category[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onSuccess: (product: Product) => void;
  settings: AdminSettings | null;
}

export const SellView: React.FC<SellViewProps> = ({
  categories,
  currentUser,
  onOpenAuth,
  onSuccess,
  settings
}) => {
  const [isGift, setIsGift] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState<string>('25');
  const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'fair'>('good');
  const [city, setCity] = useState(currentUser?.city || 'Madrid');
  const [province, setProvince] = useState(currentUser?.province || 'Madrid');
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'shipping' | 'both'>('both');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 font-heading">
          Inicia sesión para publicar tu anuncio
        </h2>
        <p className="text-xs text-slate-500">
          Para garantizar la seguridad de compradores y vendedores, es necesario tener una cuenta verificada.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Iniciar sesión o Registrarme
        </button>
      </div>
    );
  }

  // Handle local image file uploads with canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress on canvas to max 1200px width/height
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setImages(prev => [...prev.slice(0, 7), dataUrl]); // max 8 photos
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev.slice(0, 7), imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const numericPrice = isGift ? 0 : Math.max(0, Number(price) || 0);
  const commissionPercent = settings?.commissionPercent || 8;
  const commission = Math.round(numericPrice * (commissionPercent / 100) * 100) / 100;
  const netEarnings = Math.max(0, Math.round((numericPrice - commission) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (images.length === 0) {
        throw new Error('Debes añadir al menos una fotografía del producto.');
      }
      if (!title.trim() || title.length < 4) {
        throw new Error('El título debe tener al menos 4 caracteres.');
      }
      if (!description.trim()) {
        throw new Error('Por favor, incluye una descripción del artículo.');
      }

      const res = await api.createProduct({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || categories[0]?.id,
        price: numericPrice,
        isGift,
        condition,
        approxLocation: {
          city: city.trim() || 'Madrid',
          province: province.trim() || 'Madrid'
        },
        shippingMethod,
        images
      });

      onSuccess(res.product);
    } catch (err: any) {
      setError(err.message || 'Error al publicar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Publicar un nuevo anuncio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vende tus artículos o regálalos de forma solidaria a otros usuarios en España.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Modalidad: Venta vs Regalo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">¿Qué deseas hacer?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsGift(false)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  !isGift 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <DollarSign className={`w-5 h-5 shrink-0 ${!isGift ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Vender producto</span>
                  <span className="text-[11px] text-slate-500">Recibe pagos protegidos y comisiones transparentes.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsGift(true)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isGift 
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Gift className={`w-5 h-5 shrink-0 ${isGift ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">🎁 Regalar gratis (0 €)</span>
                  <span className="text-[11px] text-slate-500">Solidaridad y economía circular sin comisiones.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Título del anuncio</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Bicicleta de montaña en excelente estado, talla M"
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Categoría y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Estado del artículo</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="new">Nuevo a estrenar (con precinto/etiquetas)</option>
                <option value="like_new">Como nuevo (sin marcas de uso)</option>
                <option value="good">En buen estado (uso normal)</option>
                <option value="fair">Aceptable (con señales evidentes de uso)</option>
              </select>
            </div>
          </div>

          {/* Precio y desglose transparente de comisiones */}
          {!isGift ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-800">Precio de venta (€)</label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl p-2.5 pr-8 focus:outline-hidden focus:border-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">€</span>
              </div>

              {/* Real financial transparency calculation */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Precio para el comprador:</span>
                  <span className="font-semibold text-slate-800">{numericPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Comisión de protección MercadoX ({commissionPercent}%):</span>
                  <span>- {commission.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-700 pt-1 border-t border-slate-200/60 text-sm">
                  <span>Tú recibirás limpio tras la entrega:</span>
                  <span>{netEarnings.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Regalo solidario a 0 €:</strong> Este artículo no tiene precio de venta ni comisión alguna.
              </span>
            </div>
          )}

          {/* Fotografías */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Fotografías del artículo ({images.length}/8)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Sube fotos claras del producto real. Las imágenes con buena luz se venden hasta 3 veces más rápido.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {images.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-600">Subir foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Optional URL adder */}
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="O añade URL directa de imagen (https://...)"
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Añadir URL
              </button>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Descripción detallada</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe las características, dimensiones, si incluye accesorios o caja original, y cualquier detalle relevante para el comprador..."
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Ubicación y Método de entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Ciudad</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madrid, Valencia..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Por privacidad, nunca mostramos tu dirección exacta.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Provincia</label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Provincia"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Forma de entrega</label>
            <select
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="both">En mano o mediante Envío protegido</option>
              <option value="pickup">Solo trato en mano presencial</option>
              <option value="shipping">Solo mediante Envío por paquetería</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Revisión de seguridad activa antes de publicar</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Publicando...' : (isGift ? 'Publicar regalo gratis' : 'Publicar anuncio de venta')}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
