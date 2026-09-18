import React, { useState, useEffect } from 'react';
import { 
  Users, Search, ShieldCheck, ShieldAlert, AlertTriangle, 
  CheckCircle2, XCircle, Ban, RefreshCw, UserCheck, Eye,
  Package, ShoppingBag, ShoppingCart, Flag, Calendar, MapPin, Mail, Phone
} from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminUsersTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onNotify }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'verified' | 'unverified' | 'pro' | 'suspended' | 'risk'>('all');
  
  // Selected user full details
  const [inspectUserModal, setInspectUserModal] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<{
    user: any;
    listings: any[];
    sales: any[];
    purchases: any[];
    reports: any[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [actionReason, setActionReason] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'publicaciones' | 'ventas' | 'compras' | 'reportes'>('perfil');

  const loadUsers = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(searchTerm);
      setUsers(res.users);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar usuarios', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  const handleInspectUser = async (user: any) => {
    setInspectUserModal(user);
    setSelectedRisk(user.riskScore || 'low');
    setActiveSubTab('perfil');
    setLoadingDetails(true);
    try {
      const res = await api.getAdminUserDetails(user.id);
      setUserDetails(res);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar detalles de la cuenta', true);
    } finally {
      setLoadingDetails(false);
    }
  };

  const executeAction = async (userId: string, action: string, riskScore?: string) => {
    setActionLoading(true);
    try {
      const res = await api.adminUserAction(userId, action, riskScore, actionReason);
      onNotify(res.message || 'Acción ejecutada correctamente');
      setInspectUserModal(null);
      setUserDetails(null);
      setActionReason('');
      loadUsers(search);
    } catch (err: any) {
      onNotify(err.message || 'Error al ejecutar acción', true);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === 'verified') return u.verificationLevel === 'identity_verified' || u.verificationLevel === 'verified';
    if (filterRole === 'unverified') return u.verificationLevel === 'basic' || !u.verificationLevel;
    if (filterRole === 'pro') return u.isPro;
    if (filterRole === 'suspended') return u.isSuspended || u.isBlocked;
    if (filterRole === 'risk') return u.riskScore === 'high' || u.riskScore === 'critical';
    return true;
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Gestión y Ficha de Usuarios</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspección de publicaciones, ventas, compras, reportes y control de suspensiones.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admin-user-search-input"
              type="text"
              placeholder="Buscar por ID, nombre, email o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); loadUsers(''); }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos ({users.length})
        </button>

        <button
          onClick={() => setFilterRole('verified')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'verified'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Verificados
        </button>

        <button
          onClick={() => setFilterRole('pro')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'pro'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Cuentas Pro
        </button>

        <button
          onClick={() => setFilterRole('unverified')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'unverified'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Sin verificar
        </button>

        <button
          onClick={() => setFilterRole('suspended')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'suspended'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Suspendidos / Bloqueados
        </button>

        <button
          onClick={() => setFilterRole('risk')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            filterRole === 'risk'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Riesgo Alto / Crítico
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando usuarios registrados...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se encontraron usuarios que coincidan con los criterios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Usuario</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Ubicación</th>
                  <th className="py-2.5 px-4">Verificación</th>
                  <th className="py-2.5 px-4">Riesgo</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isPro && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            PRO
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {u.email}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {u.city ? `${u.city}${u.province ? `, ${u.province}` : ''}` : 'No indicada'}
                    </td>

                    <td className="py-3 px-4">
                      {u.verificationLevel === 'identity_verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          DNI Verificado
                        </span>
                      ) : u.verificationLevel === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Cuenta Básica
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Sin verificar
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.riskScore === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : u.riskScore === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : u.riskScore === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.riskScore || 'low'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <Ban className="w-3 h-3" />
                          Bloqueado
                        </span>
                      ) : u.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Suspendido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Activo
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInspectUser(u)}
                        className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Ficha</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive User Inspection Modal */}
      {inspectUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    {inspectUserModal.name}
                  </h3>
                  {inspectUserModal.isPro && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      CUENTA PRO
                    </span>
                  )}
                  {inspectUserModal.role === 'admin' && (
                    <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      ADMIN ÚNICO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {inspectUserModal.email} · ID: {inspectUserModal.id}
                </p>
              </div>

              <button
                onClick={() => { setInspectUserModal(null); setUserDetails(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="flex border-b border-slate-200 bg-white px-5 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveSubTab('perfil')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeSubTab === 'perfil' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Perfil y Verificación
              </button>
              <button
                onClick={() => setActiveSubTab('publicaciones')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'publicaciones' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Publicaciones ({userDetails?.listings?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('ventas')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'ventas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ventas ({userDetails?.sales?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('compras')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'compras' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Compras ({userDetails?.purchases?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('reportes')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'reportes' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Reportes ({userDetails?.reports?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {loadingDetails ? (
                <div className="py-12 text-center text-slate-500">Cargando datos completos del usuario...</div>
              ) : (
                <>
                  {/* Tab 1: Perfil y Verificación */}
                  {activeSubTab === 'perfil' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Email Verificado</div>
                          <div className="font-bold text-slate-900 mt-1 flex items-center gap-1">
                            {inspectUserModal.verifiedEmail ? (
                              <span className="text-emerald-700 flex items-center gap-1">✓ Verificado</span>
                            ) : (
                              <span className="text-slate-400">Pendiente</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Teléfono Verificado</div>
                          <div className="font-bold text-slate-900 mt-1 flex items-center gap-1">
                            {inspectUserModal.verifiedPhone ? (
                              <span className="text-emerald-700 flex items-center gap-1">✓ {inspectUserModal.phone || 'Verificado'}</span>
                            ) : (
                              <span className="text-slate-400">No verificado</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">DNI / Identidad</div>
                          <div className="font-bold text-slate-900 mt-1 flex items-center gap-1">
                            {inspectUserModal.verificationLevel === 'identity_verified' ? (
                              <span className="text-emerald-700 flex items-center gap-1">✓ DNI cotejado</span>
                            ) : (
                              <span className="text-slate-400">Sin cotejar</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Fecha de Alta</div>
                          <div className="font-mono text-slate-800 mt-1">
                            {inspectUserModal.createdAt ? new Date(inspectUserModal.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Ubicación</div>
                          <div className="font-medium text-slate-800 mt-1">
                            {inspectUserModal.city || 'No declarada'}, {inspectUserModal.province || ''}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Valoración Media</div>
                          <div className="font-bold text-amber-600 mt-1">
                            ⭐ {inspectUserModal.rating ? inspectUserModal.rating.toFixed(1) : '5.0'} / 5.0
                          </div>
                        </div>
                      </div>

                      {/* Moderation Controls */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-bold text-slate-900">Acciones de Moderación Directa</h4>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">
                            Nivel de Riesgo Antifraude:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setSelectedRisk(lvl)}
                                className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedRisk === lvl
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-100'
                                }`}
                              >
                                {lvl === 'low' ? 'Bajo' : lvl === 'medium' ? 'Medio' : lvl === 'high' ? 'Alto' : 'Crítico'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">
                            Motivo / Justificación obligatoria para auditoría:
                          </label>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Indique motivo técnico o legal para la bitácora inmutable..."
                            rows={2}
                            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                          <button
                            disabled={actionLoading}
                            onClick={() => executeAction(inspectUserModal.id, 'set_risk', selectedRisk)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl cursor-pointer"
                          >
                            Actualizar Riesgo
                          </button>

                          <button
                            disabled={actionLoading}
                            onClick={() => executeAction(inspectUserModal.id, 'verify')}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl cursor-pointer"
                          >
                            Verificar Identidad (DNI)
                          </button>

                          {inspectUserModal.isSuspended ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => executeAction(inspectUserModal.id, 'reactivate')}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                            >
                              Reactivar Cuenta
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => executeAction(inspectUserModal.id, 'suspend')}
                              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
                            >
                              Suspender Cuenta
                            </button>
                          )}

                          {inspectUserModal.isBlocked ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => executeAction(inspectUserModal.id, 'unblock')}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
                            >
                              Desbloquear
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => executeAction(inspectUserModal.id, 'block')}
                              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                            >
                              Bloquear Permanente
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Publicaciones */}
                  {activeSubTab === 'publicaciones' && (
                    <div className="space-y-3">
                      {userDetails?.listings?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">Este usuario no tiene publicaciones.</div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {userDetails?.listings?.map((prod) => (
                            <div key={prod.id} className="p-3 bg-white flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-900">{prod.title}</div>
                                <div className="text-[11px] text-slate-400 font-mono">ID: {prod.id} · Categoría: {prod.categoryId}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">{prod.isGift ? 'Regalo (0 €)' : formatPrice(prod.price)}</div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  prod.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {prod.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Ventas */}
                  {activeSubTab === 'ventas' && (
                    <div className="space-y-3">
                      {userDetails?.sales?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">Sin historial de ventas.</div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {userDetails?.sales?.map((sale) => (
                            <div key={sale.id} className="p-3 bg-white flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-900">Pedido #{sale.id}</div>
                                <div className="text-[11px] text-slate-400">{new Date(sale.createdAt).toLocaleDateString('es-ES')}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">{formatPrice(sale.amount)}</div>
                                <div className="text-[10px] font-mono text-indigo-600">{sale.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Compras */}
                  {activeSubTab === 'compras' && (
                    <div className="space-y-3">
                      {userDetails?.purchases?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">Sin historial de compras.</div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {userDetails?.purchases?.map((buy) => (
                            <div key={buy.id} className="p-3 bg-white flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-900">Compra #{buy.id}</div>
                                <div className="text-[11px] text-slate-400">{new Date(buy.createdAt).toLocaleDateString('es-ES')}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">{formatPrice(buy.amount)}</div>
                                <div className="text-[10px] font-mono text-emerald-600">{buy.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 5: Reportes */}
                  {activeSubTab === 'reportes' && (
                    <div className="space-y-3">
                      {userDetails?.reports?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">No hay reportes registrados contra esta cuenta.</div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {userDetails?.reports?.map((rep) => (
                            <div key={rep.id} className="p-3 bg-white space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                                  {rep.reason}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(rep.createdAt).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                              <p className="text-slate-700 text-xs mt-1">{rep.details || 'Sin detalles adicionales aportados.'}</p>
                              <div className="text-[10px] text-slate-400 font-mono">Estado: {rep.status}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setInspectUserModal(null); setUserDetails(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
