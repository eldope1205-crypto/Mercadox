import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Phone, Award, Lock } from 'lucide-react';
import { api } from '../services/api.js';
import { User } from '../types.js';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingId, setLoadingId] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPhone(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.verifyPhone(phone);
      onUserUpdated(res.user);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al verificar teléfono.');
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleVerifyIdentity = async () => {
    setLoadingId(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.verifyIdentity();
      onUserUpdated(res.user);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al verificar identidad.');
    } finally {
      setLoadingId(false);
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

        <div className="flex items-center gap-2 mb-2 text-indigo-600">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Niveles de Confianza y Verificación
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          En MercadoX cuidamos la seguridad de compradores y vendedores. Los usuarios verificados disfrutan de mayor confianza y visibilidad.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* 3 Verification Tiers */}
        <div className="space-y-4">
          
          {/* Level 1: Basic */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Nivel 1: Cuenta básica</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Completado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Email verificado ({currentUser.email}). Permite publicar y chatear.
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          </div>

          {/* Level 2: Verified (Email + Phone) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            currentUser.verifiedPhone 
              ? 'border-emerald-200 bg-emerald-50/50' 
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Nivel 2: Cuenta verificada</span>
                  {currentUser.verifiedPhone ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ✓ Teléfono verificado
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verificación de teléfono móvil nacional. Protege contra cuentas duplicadas y automatizadas.
                </p>
              </div>
              {currentUser.verifiedPhone && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </div>

            {!currentUser.verifiedPhone && (
              <form onSubmit={handleVerifyPhone} className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingPhone}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                >
                  {loadingPhone ? 'Verificando...' : 'Verificar móvil'}
                </button>
              </form>
            )}
          </div>

          {/* Level 3: Identity Verified (External provider, no sensitive docs stored) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            currentUser.verificationLevel === 'identity_verified'
              ? 'border-emerald-200 bg-emerald-50/50' 
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Nivel 3: Identidad verificada</span>
                  {currentUser.verificationLevel === 'identity_verified' ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      ✓ Insignia oficial activa
                    </span>
                  ) : (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validación de identidad a través de pasarela compatible. No almacenamos DNI ni documentos sensibles en servidores de MercadoX.
                </p>
              </div>
              {currentUser.verificationLevel === 'identity_verified' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </div>

            {currentUser.verificationLevel !== 'identity_verified' && (
              <div className="mt-3">
                <button
                  onClick={handleVerifyIdentity}
                  disabled={loadingId}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{loadingId ? 'Conectando con proveedor de identidad...' : 'Completar verificación de identidad'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Datos protegidos bajo RGPD (UE 2016/679)</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
