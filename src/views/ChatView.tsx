import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, ShieldAlert, AlertTriangle, 
  Flag, MapPin, CheckCircle, Package, ArrowLeft, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Conversation, ChatMessage, User } from '../types.js';
import { ReportModal } from '../components/ReportModal.js';

interface ChatViewProps {
  initialConversationId?: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialConversationId,
  currentUser,
  onOpenAuth,
  onNavigate
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId || null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Anti-scam keyword detector in client
  const scamWordsRegex = /\b(bizum|whatsapp|transferencia|banco|ingreso|cuenta bancaria|paypal amigo|cripto|telegram|link|enlace|pago fuera)\b/i;
  const isSuspiciousTyping = scamWordsRegex.test(inputText);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (!selectedId && res.conversations.length > 0) {
        setSelectedId(res.conversations[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await api.getMessages(convId);
      setActiveConversation(res.conversation);
      setMessages(res.messages);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      // Poll every 5s for new messages in the open chat
      const interval = setInterval(() => {
        fetchMessages(selectedId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedId || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await api.sendMessage(selectedId, textToSend);
      setMessages(prev => [...prev, res.message]);
      scrollToBottom();
      fetchConversations();
    } catch (err: any) {
      alert(err.message || 'Error al enviar el mensaje.');
      setInputText(textToSend); // restore on error
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Inicia sesión para ver tus mensajes</h2>
        <p className="text-xs text-slate-500">
          Tus conversaciones con compradores y vendedores se almacenan de forma segura y privada.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      
      {/* Anti-Scam Banner - Prominent Security Header */}
      <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block">🛡️ Consejo de seguridad antifraude de MercadoX:</span>
          <span>
            Nunca aceptes solicitudes de pago por Bizum, enlaces externos o transferencias directas. Todos los pagos protegidos se realizan exclusivamente a través del botón oficial "Comprar seguro" dentro de la plataforma.
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        
        {/* Left Column: Conversations list (4 cols) */}
        <div className={`md:col-span-4 border-r border-slate-200 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-heading">Tus mensajes</h2>
            <span className="text-xs text-slate-400 font-medium">{conversations.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No tienes conversaciones activas.</p>
                <p className="text-[11px] text-slate-400">
                  Explora productos e inicia un chat con el vendedor para consultar detalles.
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedId === conv.id;
                const otherUserName = conv.buyerId === currentUser.id ? conv.sellerName : conv.buyerName;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={conv.productImage || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&q=80'}
                      alt={conv.productTitle}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">{otherUserName}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(conv.lastMessageAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-indigo-600 truncate">{conv.productTitle}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessageText || 'Conversación iniciada'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active chat thread (8 cols) */}
        <div className={`md:col-span-8 flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-3.5 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={activeConversation.productImage || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&q=80'}
                    alt={activeConversation.productTitle}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate max-w-xs">
                      {activeConversation.productTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{activeConversation.productPrice === 0 ? '0 € · Regalo solidario' : `${activeConversation.productPrice} €`}</span>
                      <span>·</span>
                      <button
                        onClick={() => onNavigate('product', activeConversation.productId)}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Ver anuncio
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Reportar conversación"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Comienza la conversación con el vendedor de forma segura.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Fraud warning indicator if flagged by anti-scam */}
                        {msg.isFlaggedAsScam && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Mensaje detectado con posibles peticiones de pago externo</span>
                          </div>
                        )}

                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Real-Time Fraud Pre-warning if suspicious keyword detected */}
              {isSuspiciousTyping && (
                <div className="px-4 py-2 bg-amber-100/90 border-t border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-medium text-[11px]">
                    <strong>Aviso de seguridad:</strong> Detectadas palabras como "bizum" o "transferencia". MercadoX nunca cubre compras gestionadas fuera de la web.
                  </span>
                </div>
              )}

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje seguro..."
                  className="flex-1 text-xs sm:text-sm bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white rounded-full px-4 py-2.5 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-semibold text-slate-600">Selecciona una conversación</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Elige un chat de la lista de la izquierda para ver el historial y responder.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Report Modal */}
      {activeConversation && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="user"
          targetId={activeConversation.sellerId === currentUser.id ? activeConversation.buyerId : activeConversation.sellerId}
          targetName="Usuario en conversación"
        />
      )}

    </div>
  );
};
