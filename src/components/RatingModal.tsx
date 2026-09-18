import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Order } from '../types.js';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.submitRating({
        orderId: order.id,
        stars,
        comment
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar valoración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-amber-500">
          <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Valorar Transacción Real
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Transacción verificada para el producto: <span className="font-semibold text-slate-800">{order.productTitle}</span>
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex flex-col items-center py-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium mb-2">Puntuación</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (hoverStars || stars) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverStars(starValue)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setStars(starValue)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1">
              {stars} de 5 estrellas
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comentario sobre la experiencia (Opcional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Cómo fue la entrega, el trato y el estado del artículo? Tu opinión ayuda a mantener un marketplace seguro."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Guardando...' : 'Publicar valoración'}
            </button>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-3">
          Solo los usuarios con transacciones completadas pueden publicar reseñas. No admitimos reseñas ficticias.
        </p>
      </div>
    </div>
  );
};
