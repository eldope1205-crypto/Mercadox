import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, DollarSign, Bell, Lock, Save, RefreshCw, 
  CheckCircle, AlertCircle, Palette, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminSettingsTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<any>({
    platformName: 'MercadoX',
    logoText: 'MercadoX',
    primaryColor: '#4f46e5',
    commissionPercent: 8,
    bannerNotice: '',
    bannerEnabled: false,
    maintenanceMode: false,
    footerLegalNotice: 'MercadoX Marketplace S.L. · Todos los derechos reservados. Depósito seguro y pagos protegidos.',
    stripeConfigured: false,
    smtpConfigured: false,
    stripePublishableKeyMasked: 'No configurado',
    smtpHostMasked: 'No configurado',
    authorizedAdminEmail: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSettings();
      setSettings((prev: any) => ({
        ...prev,
        ...res.settings
      }));
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar ajustes', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSettings({
        platformName: settings.platformName,
        logoText: settings.logoText,
        primaryColor: settings.primaryColor,
        commissionPercent: settings.commissionPercent,
        bannerNotice: settings.bannerNotice,
        footerLegalNotice: settings.footerLegalNotice,
        maintenanceMode: settings.maintenanceMode,
        bannerEnabled: settings.bannerEnabled
      });
      onNotify('Configuración global de MercadoX actualizada y registrada en auditoría.');
      loadSettings();
    } catch (err: any) {
      onNotify(err.message || 'Error al guardar ajustes', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Configuración General de la Plataforma</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajustes globales de marca, comisiones, avisos legales, modo mantenimiento y estado de integraciones.
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refrescar ajustes"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Identidad y Marca</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre de la Plataforma:
              </label>
              <input
                type="text"
                required
                value={settings.platformName || ''}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Logo / Texto del Logo:
              </label>
              <input
                type="text"
                required
                value={settings.logoText || ''}
                onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Color Principal (Hexadecimal):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor || '#4f46e5'}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-slate-50"
                />
                <input
                  type="text"
                  value={settings.primaryColor || '#4f46e5'}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Policy & Commission */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Política de Comisiones</span>
          </h3>

          <div className="max-w-xs text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Porcentaje de Comisión sobre Ventas (%):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                required
                value={settings.commissionPercent || 8}
                onChange={(e) => setSettings({ ...settings, commissionPercent: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-indigo-700 focus:bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Comisión estándar retenida de las transacciones protegidas.
            </span>
          </div>
        </div>

        {/* Integration Status: Stripe & SMTP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-700" />
            <span>Estado de Integraciones Externas</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stripe Gateway Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              settings.stripeConfigured 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Pasarela Stripe</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  settings.stripeConfigured 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {settings.stripeConfigured ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      No conectado (Pendiente)
                    </>
                  )}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Clave pública: <span className="font-mono text-slate-800 font-semibold">{settings.stripePublishableKeyMasked}</span>
              </p>
            </div>

            {/* Email / SMTP Status Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              settings.smtpConfigured 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Servidor Email / SMTP</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  settings.smtpConfigured 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {settings.smtpConfigured ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      No conectado (Local)
                    </>
                  )}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Host SMTP: <span className="font-mono text-slate-800 font-semibold">{settings.smtpHostMasked}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Banner Notification & Maintenance Mode */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Avisos Globales y Mantenimiento</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Banner Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Banner Informativo Global</div>
                <div className="text-[11px] text-slate-500">Muestra un banner superior visible para todos los usuarios en la web.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bannerEnabled || false}
                  onChange={(e) => setSettings({ ...settings, bannerEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Texto del Banner Informativo:
              </label>
              <input
                type="text"
                value={settings.bannerNotice || ''}
                onChange={(e) => setSettings({ ...settings, bannerNotice: e.target.value })}
                placeholder="Ejemplo: ¡Bienvenido a MercadoX! Envíos protegidos con garantía total en toda la península..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <div>
                <div className="font-bold text-rose-900">Modo Mantenimiento Activable</div>
                <div className="text-[11px] text-rose-700">Pone la tienda en pausa para usuarios mientras el administrador realiza tareas de mantenimiento.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Legal Notice in Footer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Aviso Legal en el Pie</span>
          </h3>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Texto del Aviso Legal en el Footer:
            </label>
            <textarea
              rows={2}
              value={settings.footerLegalNotice || ''}
              onChange={(e) => setSettings({ ...settings, footerLegalNotice: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando cambios...' : 'Guardar Todos los Parámetros'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
