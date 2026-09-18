import React, { useState } from 'react';
import { X, AlertCircle, Scale, ShieldAlert } from 'lucide-react';
import { api } from '../services/api.js';
import { Order, DisputeReason } from '../types.js';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  const [reason, setReason] = useState<DisputeReason>('not_received');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.openDispute({
        orderId: order.id,
        reason,
        description,
        evidenceUrls: evidenceUrl ? [evidenceUrl.trim()] : []
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al abrir la disputa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-rose-600">
          <Scale className="w-6 h-6 text-rose-600" />
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Abrir Disputa / Reclamación Oficial
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Para el pedido: <span className="font-semibold text-slate-800">#{order.id} ({order.productTitle})</span>
        </p>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            Al abrir una disputa, el pedido quedará retenido preventivamente y el equipo de mediación revisará los mensajes, envíos y pruebas aportadas.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo de la disputa</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="not_received">Producto no recibido tras el plazo acordado</option>
              <option value="different_from_desc">Producto muy diferente al anunciado en fotografías/descripción</option>
              <option value="damaged">Producto dañado o defectuoso durante el envío</option>
              <option value="counterfeit">Sospecha fundamentada de producto falsificado</option>
              <option value="payment_issue">Incidencia con el importe o cargos</option>
              <option value="seller_issue">Problema de comunicación grave con el vendedor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción detallada de lo sucedido
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica detalladamente qué ha ocurrido, qué intentaste acordar con la otra parte y qué solución solicitas..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enlace a pruebas fotográficas o albarán de envío (Opcional)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://... o enlace a captura/fotografía"
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Registrando disputa...' : 'Confirmar y abrir disputa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
