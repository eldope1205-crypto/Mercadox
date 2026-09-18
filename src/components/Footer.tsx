import React from 'react';
import { ShieldCheck, Lock, Heart, CheckCircle2 } from 'lucide-react';
import { User } from '../types.js';

interface FooterProps {
  onNavigate: (view: string) => void;
  platformName?: string;
  currentUser?: User | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, platformName = 'MercadoX', currentUser }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                MX
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{platformName}</span>
              <span className="text-xs bg-indigo-900/80 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-700/50">
                España
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Plataforma marketplace de compra, venta y regalos entre particulares. 
              Garantizamos transacciones protegidas con sistema antifraude integrado, 
              detección de pagos externos en chat y verificación de usuarios.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protección activa contra pagos externos no autorizados</span>
            </div>
          </div>

          {/* Navigation Col 1: Comprar y Vender */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition-colors cursor-pointer">
                  Comprar productos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-white transition-colors cursor-pointer">
                  Vender un producto
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gifts')} className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer">
                  <span>🎁 Regala gratis (0 €)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('como-funciona')} className="hover:text-white transition-colors cursor-pointer">
                  Cómo funciona
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Col 2: Seguridad y Confianza */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Seguridad</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('seguridad')} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Consejos antifraude</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seguridad')} className="hover:text-white transition-colors cursor-pointer">
                  Por qué no pagar por Bizum
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('como-funciona')} className="hover:text-white transition-colors cursor-pointer">
                  Protección de pagos
                </button>
              </li>
              {currentUser?.isAuthorizedAdmin && (
                <li>
                  <button onClick={() => onNavigate('admin')} className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Panel de Administración</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Navigation Col 3: Legalidad y Privacidad UE */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Legal y Transparencia</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('terminos')} className="hover:text-white transition-colors cursor-pointer">
                  Términos y condiciones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacidad')} className="hover:text-white transition-colors cursor-pointer">
                  Política de privacidad (RGPD)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terminos')} className="hover:text-white transition-colors cursor-pointer">
                  Comisiones y tarifas (8%)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacidad')} className="hover:text-white transition-colors cursor-pointer">
                  Política de cookies
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} {platformName}. Todos los derechos reservados. Diseñado para particulares en España.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Servidores seguros y cifrado activo
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
