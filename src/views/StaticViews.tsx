import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, Gift, Scale, ArrowLeft } from 'lucide-react';

interface StaticViewProps {
  onNavigate: (view: string) => void;
}

export const ComoFuncionaView: React.FC<StaticViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Cómo funciona MercadoX España
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Guía integral sobre comprar, vender y regalar con protección de pagos y mediación legal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            1
          </div>
          <h2 className="text-sm font-bold text-slate-900">Comprar de forma segura</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Busca el artículo que te interese y pulsa "Comprar seguro". El dinero queda retenido en custodia dentro de MercadoX. No se le transfiere al vendedor hasta que recibes el paquete y confirmas que todo está perfecto.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            2
          </div>
          <h2 className="text-sm font-bold text-slate-900">Vender con cobro garantizado</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Publica en minutos. Cuando alguien compra tu artículo, empaquétalo y añade el número de seguimiento. MercadoX cobra una comisión transparente del 8% solo cuando la venta se completa exitosamente.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            3
          </div>
          <h2 className="text-sm font-bold text-slate-900">Regalar gratis (0 €)</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Fomentamos la economía circular. Puedes publicar productos a 0 € sin comisión alguna. Recibe solicitudes de personas interesadas, acuerda la recogida y ayuda a dar una segunda vida a tus objetos.
          </p>
        </div>
      </div>
    </div>
  );
};

export const SeguridadView: React.FC<StaticViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </button>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
          <ShieldAlert className="w-4 h-4" />
          <span>Guía Oficial de Prevención de Fraudes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Consejos de Seguridad y Antifraude en MercadoX
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Por qué nunca debes pagar por Bizum ni aceptar enlaces fuera de la plataforma.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">La regla de oro: Mantén todo dentro de MercadoX</h2>
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            <strong>1. Nunca envíes dinero por Bizum o transferencia bancaria directa:</strong> Las transferencias inmediatas por Bizum son irreversibles y no ofrecen ninguna protección al comprador. El 95% de las denuncias en marketplaces de segunda mano proceden de personas que pagaron por Bizum creyendo que el vendedor les enviaría el producto.
          </p>
          <p>
            <strong>2. Cuidado con enlaces externos por WhatsApp o SMS:</strong> Los estafadores suelen pedir tu teléfono para escribirte por WhatsApp y enviarte enlaces falsos que simulan ser pasarelas de pago o empresas de paquetería (phishing). MercadoX nunca te enviará un enlace de pago por WhatsApp.
          </p>
          <p>
            <strong>3. Nuestro chat cuenta con escáner en tiempo real:</strong> Si un usuario te pide pagar por fuera, nuestro sistema marcará el mensaje con una alerta amarilla o roja. Denuncia inmediatamente la conversación usando el botón "Reportar".
          </p>
          <p>
            <strong>4. Protección de fondos en custodia:</strong> Cuando utilizas "Comprar seguro", tu dinero queda bloqueado de forma neutral. Si el producto nunca llega o no se corresponde con lo anunciado, abres una disputa y el dinero se te devuelve.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TerminosView: React.FC<StaticViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </button>

      <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
        Términos y Condiciones de Servicio
      </h1>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
        <p><strong>1. Objeto del servicio:</strong> MercadoX es una plataforma tecnológica que facilita el contacto y la transacción segura entre particulares en territorio español y europeo.</p>
        <p><strong>2. Comisiones aplicables:</strong> Se aplica una comisión de servicio del 8% sobre el precio de venta acordado en transacciones exitosas. Las publicaciones en modalidad de regalo (0 €) están totalmente exentas de comisiones.</p>
        <p><strong>3. Artículos prohibidos:</strong> Queda estrictamente prohibida la venta de armas, medicamentos, sustancias ilícitas, réplicas falsificadas de marcas registradas o animales vivos.</p>
        <p><strong>4. Procedimiento de disputas:</strong> En caso de discrepancia, las partes pueden solicitar la intervención del equipo de mediación de MercadoX aportando fotografías y comprobantes oficiales de envío.</p>
      </div>
    </div>
  );
};

export const PrivacidadView: React.FC<StaticViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </button>

      <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
        Política de Privacidad y RGPD (UE 2016/679)
      </h1>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
        <p><strong>1. Minimización de datos:</strong> En MercadoX aplicamos el principio de minimización. Tu dirección exacta nunca se comparte públicamente; los anuncios solo muestran ciudad y provincia aproximadas.</p>
        <p><strong>2. Seguridad de contraseñas:</strong> Las credenciales se almacenan protegidas mediante PBKDF2 con salting individual de 100.000 iteraciones, impidiendo el acceso incluso en caso de brecha técnica.</p>
        <p><strong>3. Derechos del usuario:</strong> Puedes solicitar en cualquier momento el acceso, rectificación o supresión definitiva de tus datos personales enviando una solicitud a soporte@mercadox.es.</p>
      </div>
    </div>
  );
};
