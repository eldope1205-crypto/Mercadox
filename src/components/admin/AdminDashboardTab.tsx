import React from 'react';
import { 
  Users, Package, DollarSign, ShieldAlert, ShoppingBag, 
  TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  Lock, ArrowUpRight, Scale, Gift, Award
} from 'lucide-react';

interface AdminDashboardTabProps {
  metrics: {
    users: { registered: number; verified: number; suspended: number; underReview: number };
    products: { published: number; sold: number; gifted: number; underReview: number; reported: number };
    sales: { orders: number; confirmed: number; cancellations: number; refunds: number; disputes: number };
    finance: { volume: number; commissions: number; promotions: number; pendingBalances: number; payouts: number; commissionPercent: number };
    security: { alerts: number; reports: number; suspiciousCases: number; fraudAttempts: number; blockedAccounts: number };
  } | null;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  metrics,
  onNavigateTab
}) => {
  if (!metrics) {
    return (
      <div className="py-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Cargando métricas consolidadas del sistema...</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val || 0);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Status & Quick Info */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Panel de Control MercadoX · Entorno Seguro de Producción
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Plataforma operativa con verificación estricta de cuenta única de administrador. Todos los datos reflejan actividad real de base de datos sin simulaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="admin-quick-users"
            onClick={() => onNavigateTab('usuarios')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Moderar usuarios
          </button>
          <button
            id="admin-quick-reports"
            onClick={() => onNavigateTab('reportes')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ver reportes ({metrics.security.reports})</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Users Card */}
        <div 
          onClick={() => onNavigateTab('usuarios')} 
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-heading">
              {metrics.users.registered}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span className="text-emerald-600 font-medium">✓ {metrics.users.verified} verificados</span>
              {metrics.users.suspended > 0 && (
                <span className="text-amber-600 font-medium">⚠ {metrics.users.suspended} suspendidos</span>
              )}
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div 
          onClick={() => onNavigateTab('productos')} 
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-heading">
              {metrics.products.published}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span>{metrics.products.sold} vendidos · {metrics.products.gifted} donados</span>
              {metrics.products.underReview > 0 && (
                <span className="text-amber-600 font-medium">🔍 {metrics.products.underReview} en revisión</span>
              )}
            </div>
          </div>
        </div>

        {/* Sales Card */}
        <div 
          onClick={() => onNavigateTab('ventas')} 
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-heading">
              {metrics.sales.orders}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span className="text-emerald-600 font-medium">{metrics.sales.confirmed} completadas</span>
              {metrics.sales.disputes > 0 ? (
                <span className="text-rose-600 font-medium">⚖ {metrics.sales.disputes} disputas</span>
              ) : (
                <span className="text-slate-400">0 disputas abiertas</span>
              )}
            </div>
          </div>
        </div>

        {/* Money / Commissions Card */}
        <div 
          onClick={() => onNavigateTab('retiradas')} 
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comisiones ({metrics.finance.commissionPercent}%)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-heading">
              {formatCurrency(metrics.finance.commissions)}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span>Volumen: {formatCurrency(metrics.finance.volume)}</span>
              <span>Custodia: {formatCurrency(metrics.finance.pendingBalances)}</span>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div 
          onClick={() => onNavigateTab('seguridad')} 
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs group ${
            metrics.security.alerts > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seguridad</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              metrics.security.alerts > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-heading">
              {metrics.security.alerts}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span className={metrics.security.reports > 0 ? 'text-rose-600 font-medium' : ''}>
                {metrics.security.reports} reportes pendientes
              </span>
              <span>{metrics.security.blockedAccounts} bloqueados</span>
            </div>
          </div>
        </div>

      </div>

      {/* Financial Overview & System Health Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Flow Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Flujo Financiero MercadoX</h3>
              <p className="text-xs text-slate-500">Desglose auditado de transacciones e ingresos por comisiones</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Pagos con garantía
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-medium text-slate-500 block">Volumen bruto de ventas</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {formatCurrency(metrics.finance.volume)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Artículos transaccionados</span>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-xs font-medium text-indigo-700 block">Ingresos comisiones ({metrics.finance.commissionPercent}%)</span>
              <span className="text-xl font-bold text-indigo-900 mt-1 block">
                {formatCurrency(metrics.finance.commissions)}
              </span>
              <span className="text-[11px] text-indigo-600/80 mt-1 block">Ganancias netas plataforma</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-medium text-slate-500 block">Fondos en custodia (Escrow)</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {formatCurrency(metrics.finance.pendingBalances)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Hasta confirmación comprador</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-4 text-slate-600">
              <span>Pagos liquidados a vendedores: <strong className="text-slate-900">{formatCurrency(metrics.finance.payouts)}</strong></span>
              <span>Promociones destacadas: <strong className="text-slate-900">{formatCurrency(metrics.finance.promotions)}</strong></span>
            </div>
            <button
              onClick={() => onNavigateTab('retiradas')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Gestionar retiradas y pagos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* System & Configuration Integrity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Estado de Servicios y Conectores
            </h3>
            
            <div className="space-y-3.5 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Cuenta Admin Autorizada</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  ADMIN_EMAIL Activo
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-800">Pasarela Stripe (Tarjetas/Bizum)</span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  Modo Sandbox/Config
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-800">Servidor SMTP Notificaciones</span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  Configuración lista
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Filtro Antifraude en Chat</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Activo
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('configuracion')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center block"
            >
              Configurar parámetros generales
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
