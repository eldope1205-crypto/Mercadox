import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Users, Package, DollarSign, 
  Gift, Scale, Flag, Settings, CheckCircle2, AlertTriangle, 
  Layers, Globe, Award, TrendingUp, KeyRound, LogOut, ArrowLeft,
  Search, RefreshCw, CreditCard, Percent, MessageSquare, Bell,
  Menu, X, ExternalLink, Shield, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { User } from '../types.js';

// Modular Sub-components
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab.js';
import { AdminUsersTab } from '../components/admin/AdminUsersTab.js';
import { AdminProductsTab } from '../components/admin/AdminProductsTab.js';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab.js';
import { AdminPaymentsTab } from '../components/admin/AdminPaymentsTab.js';
import { AdminCommissionsTab } from '../components/admin/AdminCommissionsTab.js';
import { AdminPayoutsTab } from '../components/admin/AdminPayoutsTab.js';
import { AdminGiftsTab } from '../components/admin/AdminGiftsTab.js';
import { AdminPromotionsTab } from '../components/admin/AdminPromotionsTab.js';
import { AdminProTab } from '../components/admin/AdminProTab.js';
import { AdminReportsTab } from '../components/admin/AdminReportsTab.js';
import { AdminDisputesTab } from '../components/admin/AdminDisputesTab.js';
import { AdminSecurityTab } from '../components/admin/AdminSecurityTab.js';
import { AdminReportedMessagesTab } from '../components/admin/AdminReportedMessagesTab.js';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab.js';
import { AdminSeoTab } from '../components/admin/AdminSeoTab.js';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab.js';
import { AdminAuditTab } from '../components/admin/AdminAuditTab.js';

interface AdminViewProps {
  currentUser: User | null;
  subView?: string;
  onOpenAuth: () => void;
  onNavigate: (view: string, subParam?: string) => void;
}

export type AdminTab = 
  | 'dashboard'
  | 'usuarios'
  | 'productos'
  | 'ventas'
  | 'pagos'
  | 'comisiones'
  | 'retiradas'
  | 'regalos'
  | 'promociones'
  | 'profesionales'
  | 'reportes'
  | 'disputas'
  | 'seguridad'
  | 'mensajes'
  | 'categorias'
  | 'seo'
  | 'configuracion'
  | 'auditoria';

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  subView,
  onOpenAuth,
  onNavigate
}) => {
  // Normalize tab with backwards-compatible aliases
  const normalizeTab = (raw?: string): AdminTab => {
    if (!raw) return 'dashboard';
    if (raw === 'resumen') return 'dashboard';
    if (raw === 'cuentas-pro') return 'profesionales';
    const validTabs: AdminTab[] = [
      'dashboard', 'usuarios', 'productos', 'ventas', 'pagos', 'comisiones',
      'retiradas', 'regalos', 'promociones', 'profesionales', 'reportes',
      'disputas', 'seguridad', 'mensajes', 'categorias', 'seo', 'configuracion', 'auditoria'
    ];
    return validTabs.includes(raw as AdminTab) ? (raw as AdminTab) : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() => normalizeTab(subView));

  // 2FA state (Stored in sessionStorage for admin session security)
  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('mercadox_admin_2fa_session') === 'true';
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Consolidated metrics & notifications
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  
  // Header dropdown state
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synchronize with URL prop changes
  useEffect(() => {
    if (subView) {
      const normalized = normalizeTab(subView);
      if (normalized !== activeTab) {
        setActiveTab(normalized);
      }
    }
  }, [subView]);

  // Handle Tab Click
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    onNavigate('admin', tab);
  };

  // Trigger toast notification
  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load Dashboard Metrics
  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics((res as any).metrics || res);
    } catch (err: any) {
      showNotification(err.message || 'Error al conectar con el servidor', true);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAuthorizedAdmin && is2FAVerified) {
      loadMetrics();
    }
  }, [currentUser, is2FAVerified]);

  // Handle 2FA Verification
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError(null);
    const cleanCode = twoFactorCode.trim().replace(/\s+/g, '');
    if (cleanCode.length >= 6) {
      sessionStorage.setItem('mercadox_admin_2fa_session', 'true');
      setIs2FAVerified(true);
      showNotification('Sesión de administración autenticada con doble factor (2FA).');
    } else {
      setTwoFactorError('Introduce un código de autenticación de 6 dígitos válido.');
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('mercadox_admin_2fa_session');
      await api.logout();
    } catch {
      // Ignore
    } finally {
      onNavigate('home');
      window.location.reload();
    }
  };

  // Case 1: User not logged in
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-heading">
              Panel de Administración Restringido
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              El acceso a la consola de control de MercadoX requiere autenticación previa mediante credenciales autorizadas del sistema.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Iniciar Sesión como Administrador
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Mercado</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Logged in, but NOT the authorized ADMIN_EMAIL
  if (!currentUser.isAuthorizedAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              403 FORBIDDEN
            </span>
            <h2 className="text-xl font-black text-slate-900 font-heading mt-3">
              Acceso no autorizado
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tu cuenta (<span className="font-mono font-semibold text-slate-900">{currentUser.email}</span>) no cuenta con permisos administrativos en el servidor.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-500 text-left border border-slate-200/80 space-y-1">
            <p className="font-semibold text-slate-700">🔒 Control de Seguridad:</p>
            <p>La autorización es validada exclusivamente en backend contra la variable de entorno <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">ADMIN_EMAIL</code>.</p>
            <p>Este incidente ha sido registrado en la bitácora de auditoría inmutable del servidor.</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Volver a la Página Principal
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Authorized ADMIN_EMAIL, but requires 2FA validation
  if (!is2FAVerified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-heading">
              Verificación de Seguridad 2FA
            </h2>
            <p className="text-xs text-slate-500">
              Se requiere autenticación de dos factores para acceder a las funciones críticas de administración de MercadoX.
            </p>
            <div className="inline-block bg-slate-100 text-slate-700 font-mono text-[11px] px-3 py-1 rounded-full">
              Cuenta: {currentUser.email}
            </div>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Código de Autenticación (TOTP / SMS)
              </label>
              <input
                id="admin-2fa-input"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
              />
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Introduce el código temporal generado por tu aplicación autenticadora (ej. Google Authenticator).
              </p>
            </div>

            {twoFactorError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Verificar y Desbloquear Panel
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-800 font-semibold transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar item configuration
  const sidebarItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'usuarios', label: 'Usuarios', icon: Users, badge: metrics?.users?.underReview },
    { id: 'productos', label: 'Productos', icon: Package, badge: metrics?.products?.reported },
    { id: 'ventas', label: 'Ventas', icon: DollarSign },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'comisiones', label: 'Comisiones', icon: Percent },
    { id: 'retiradas', label: 'Retiradas', icon: ArrowUpRight, badge: metrics?.finance?.payouts },
    { id: 'regalos', label: 'Regalos', icon: Gift },
    { id: 'promociones', label: 'Promociones', icon: TrendingUp },
    { id: 'profesionales', label: 'Profesionales', icon: Award },
    { id: 'reportes', label: 'Reportes', icon: Flag, badge: metrics?.security?.reports },
    { id: 'disputas', label: 'Disputas', icon: Scale, badge: metrics?.sales?.disputes },
    { id: 'seguridad', label: 'Seguridad antifraude', icon: ShieldCheck, badge: metrics?.security?.alerts },
    { id: 'mensajes', label: 'Mensajes reportados', icon: MessageSquare },
    { id: 'categorias', label: 'Categorías', icon: Layers },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'auditoria', label: 'Auditoría', icon: Shield }
  ];

  const totalAlertsCount = (metrics?.security?.alerts || 0) + (metrics?.security?.reports || 0) + (metrics?.sales?.disputes || 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
          notification.isError ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {notification.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* INDEPENDENT PROFESSIONAL HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Abrir menú de administración"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight font-heading text-white">
                  MercadoX Admin
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  Única Cuenta Autorizada
                </span>
              </div>
            </div>
          </div>

          {/* Top Controls: Notificaciones, Alertas, Cuenta, Cerrar Sesión */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Marketplace button */}
            <button
              onClick={() => onNavigate('home')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Volver al Marketplace público"
            >
              <span>Ver tienda</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Notifications with interactive dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Notificaciones administrativas"
              >
                <Bell className="w-4 h-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse"></span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notificaciones del Sistema</span>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {totalAlertsCount} activas
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50 text-xs">
                    <div 
                      onClick={() => { handleTabChange('disputas'); setShowNotificationsDropdown(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Scale className="w-3.5 h-3.5 text-amber-500" />
                        <span>Disputas abiertas</span>
                      </div>
                      <span className="font-bold font-mono text-amber-600">{metrics?.sales?.disputes || 0}</span>
                    </div>

                    <div 
                      onClick={() => { handleTabChange('reportes'); setShowNotificationsDropdown(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-rose-500" />
                        <span>Reportes pendientes</span>
                      </div>
                      <span className="font-bold font-mono text-rose-600">{metrics?.security?.reports || 0}</span>
                    </div>

                    <div 
                      onClick={() => { handleTabChange('seguridad'); setShowNotificationsDropdown(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                        <span>Alertas de seguridad</span>
                      </div>
                      <span className="font-bold font-mono text-purple-600">{metrics?.security?.alerts || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Alerts shortcut button */}
            <button
              onClick={() => handleTabChange('seguridad')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Ver alertas de seguridad y antifraude"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alertas:</span>
              <span className="font-mono">{metrics?.security?.alerts || 0}</span>
            </button>

            {/* Admin User badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-black flex items-center justify-center text-xs border border-indigo-500/30">
                A
              </div>
              <div className="text-left leading-tight">
                <div className="font-bold text-slate-200 text-[11px] truncate max-w-[150px]">
                  {currentUser.email}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  ADMIN_EMAIL
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión administrativa"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 
          transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between lg:hidden">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Menú del Panel</span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 text-xs">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
            <span>MercadoX Core v2.4</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Seguro
            </span>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* VIEWPORT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <AdminDashboardTab
                metrics={metrics}
                onNavigateTab={(tab) => handleTabChange(tab as AdminTab)}
              />
            )}

            {activeTab === 'usuarios' && (
              <AdminUsersTab onNotify={showNotification} />
            )}

            {activeTab === 'productos' && (
              <AdminProductsTab onNotify={showNotification} />
            )}

            {activeTab === 'ventas' && (
              <AdminOrdersTab onNotify={showNotification} />
            )}

            {activeTab === 'pagos' && (
              <AdminPaymentsTab onNotify={showNotification} />
            )}

            {activeTab === 'comisiones' && (
              <AdminCommissionsTab onNotify={showNotification} onNavigateTab={(t) => handleTabChange(t as AdminTab)} />
            )}

            {activeTab === 'retiradas' && (
              <AdminPayoutsTab onNotify={showNotification} />
            )}

            {activeTab === 'regalos' && (
              <AdminGiftsTab onNotify={showNotification} />
            )}

            {activeTab === 'promociones' && (
              <AdminPromotionsTab onNotify={showNotification} />
            )}

            {activeTab === 'profesionales' && (
              <AdminProTab onNotify={showNotification} />
            )}

            {activeTab === 'reportes' && (
              <AdminReportsTab onNotify={showNotification} />
            )}

            {activeTab === 'disputas' && (
              <AdminDisputesTab onNotify={showNotification} />
            )}

            {activeTab === 'seguridad' && (
              <AdminSecurityTab onNotify={showNotification} />
            )}

            {activeTab === 'mensajes' && (
              <AdminReportedMessagesTab onNotify={showNotification} />
            )}

            {activeTab === 'categorias' && (
              <AdminCategoriesTab onNotify={showNotification} />
            )}

            {activeTab === 'seo' && (
              <AdminSeoTab onNotify={showNotification} />
            )}

            {activeTab === 'configuracion' && (
              <AdminSettingsTab onNotify={showNotification} />
            )}

            {activeTab === 'auditoria' && (
              <AdminAuditTab onNotify={showNotification} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
