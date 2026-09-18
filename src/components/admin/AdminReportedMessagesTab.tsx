import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Shield, CheckCircle2, User, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminReportedMessagesTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
  onNavigateUser?: (userId: string) => void;
}

export const AdminReportedMessagesTab: React.FC<AdminReportedMessagesTabProps> = ({ onNotify, onNavigateUser }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminFlaggedMessages();
      setMessages(res.flaggedMessages || []);
    } catch (err: any) {
      onNotify(err.message || 'Error al obtener mensajes sospechosos', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleTakeAction = async (action: 'warn' | 'suspend') => {
    if (!selectedMessage) return;
    if (!actionReason.trim()) {
      onNotify('Debes especificar un motivo para el registro de auditoría.', true);
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'suspend') {
        await api.adminUserAction(selectedMessage.senderId, 'suspend', 'critical', actionReason);
        onNotify(`Usuario remitente (${selectedMessage.senderName}) suspendido por infracción de seguridad.`);
      } else {
        await api.adminUserAction(selectedMessage.senderId, 'set_risk', 'high', `Advertencia de seguridad: ${actionReason}`);
        onNotify(`Usuario advertido y marcado con riesgo elevado.`);
      }
      setSelectedMessage(null);
      setActionReason('');
      loadMessages();
    } catch (err: any) {
      onNotify(err.message || 'Error al aplicar sanción', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-600" />
            <span>Mensajes Reportados y Alertas Antifraude</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección de intentos de transacción fuera de MercadoX (Bizum, transferencias, WhatsApp, enlaces phishing).
          </p>
        </div>
        <button
          onClick={loadMessages}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refrescar mensajes"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages List & Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List of Messages */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Mensajes Interceptados ({messages.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Auditados bajo RGPD
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Cargando mensajes reportados...</div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700">Sin mensajes sospechosos pendientes</p>
              <p className="text-[11px]">No hay reportes de conversaciones ni patrones de fraude detectados en este momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMessage(m)}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                    selectedMessage?.id === m.id ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.senderName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({m.senderMaskedEmail})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 font-medium my-2">
                    "{m.text}"
                  </div>

                  {m.detectedPatterns && m.detectedPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.detectedPatterns.map((pat: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {pat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Message Action Panel */}
        <div className="lg:col-span-5">
          {selectedMessage ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  Detalle del Mensaje
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  Remitente: {selectedMessage.senderName}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  ID Usuario: {selectedMessage.senderId}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Contenido Completo:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono mt-1 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.text}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-500 text-[11px]">Conversación asociada:</div>
                <div className="font-mono text-slate-800 font-semibold">{selectedMessage.conversationId}</div>
              </div>

              {/* Sanction Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Motivo de la acción moderadora:
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ej: Intento explícito de cobro por Bizum externo evadiendo la protección al comprador..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleTakeAction('warn')}
                    disabled={actionLoading}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors cursor-pointer"
                  >
                    Marcar Riesgo Alto
                  </button>

                  <button
                    onClick={() => handleTakeAction('suspend')}
                    disabled={actionLoading}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Suspender Cuenta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-slate-400 text-xs">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Selecciona un mensaje</p>
              <p className="text-[11px] mt-1">Haz clic en cualquier mensaje de la lista para ver el análisis de fraude y tomar acciones de moderación.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
