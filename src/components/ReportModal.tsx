import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { ReportReason, ReportTargetType } from '../types.js';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName
}) => {
  const [reason, setReason] = useState<ReportReason>('scam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.submitReport({
        targetType,
        targetId,
        reason,
        details
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar reporte.');
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

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-in zoom-in" />
            <h3 className="text-base font-bold text-slate-900">Reporte registrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gracias por colaborar en mantener MercadoX seguro. El equipo de moderación revisará este caso.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 text-rose-600">
              <Flag className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Reportar {targetType === 'product' ? 'anuncio' : targetType === 'user' ? 'usuario' : 'mensaje'}
              </h3>
            </div>

            {targetName && (
              <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 truncate">
                Elemento: <span className="font-semibold text-slate-800">{targetName}</span>
              </p>
            )}

            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo del reporte</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="scam">Posible estafa o fraude</option>
                  <option value="off_platform_payment">Intento de pago externo (Bizum, transferencia, links)</option>
                  <option value="prohibited_item">Producto prohibido por ley o términos</option>
                  <option value="counterfeit">Producto falsificado o imitación</option>
                  <option value="misleading_price">Precio engañoso o falso</option>
                  <option value="suspicious_account">Cuenta sospechosa o duplicada</option>
                  <option value="spam">Spam o publicación repetitiva</option>
                  <option value="inappropriate">Contenido inapropiado u ofensivo</option>
                  <option value="other">Otro motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detalles adicionales</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explica qué problema has detectado para facilitar la moderación..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
