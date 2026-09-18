import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Building2, FileText, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminProTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminProTab: React.FC<AdminProTabProps> = ({ onNotify }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [activePros, setActivePros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminProApplications();
      setApplications(res.applications);
      setActivePros(res.activeProAccounts);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar cuentas profesionales', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await api.updateAdminProApplicationStatus(id, status, rejectionReason);
      onNotify(`Solicitud profesional ${status === 'approved' ? 'aprobada' : 'rechazada'}.`);
      setSelectedApp(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      onNotify(err.message || 'Error al procesar solicitud', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Validación de Cuentas Profesionales (B2C)</h2>
          <p className="text-xs text-slate-500">
            Revisión de NIF/CIF, documentación fiscal y acreditación de vendedores profesionales.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Applications Under Review */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Solicitudes de Alta Pendientes
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Cargando solicitudes...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay solicitudes de cuentas profesionales pendientes de revisión.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Empresa / Razón Social</th>
                  <th className="py-2.5 px-4">NIF / CIF</th>
                  <th className="py-2.5 px-4">Contacto Solicitante</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {app.companyName}
                      <div className="text-[10px] font-normal text-slate-400 font-mono">
                        {app.businessAddress || 'Dirección fiscal aportada'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {app.cifOrNif}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{app.userName}</div>
                      <div className="text-[10px] text-slate-400">{app.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        app.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : app.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {app.status === 'approved' ? 'Aprobada' : app.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {app.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                        >
                          Revisar
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Revisada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Pro Users */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Cuentas Profesionales Activas ({activePros.length})
        </h3>
        {activePros.length === 0 ? (
          <p className="text-xs text-slate-400">Actualmente no hay usuarios con insignia Pro activa.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePros.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{p.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.maskedEmail}</div>
                <div className="text-[11px] text-slate-600 mt-1">{p.city || 'España'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Acreditar Empresa: {selectedApp.companyName}
              </h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
              <div><strong>CIF/NIF:</strong> <span className="font-mono font-bold text-slate-900">{selectedApp.cifOrNif}</span></div>
              <div><strong>Razón Social:</strong> {selectedApp.companyName}</div>
              <div><strong>Dirección:</strong> {selectedApp.businessAddress || 'No detallada'}</div>
              <div><strong>Nota fiscal aportada:</strong> {selectedApp.taxDocumentNote || 'Declaración responsable'}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo de rechazo (si aplica):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indica el motivo legal o documental..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleReview(selectedApp.id, 'rejected')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
              >
                Rechazar
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleReview(selectedApp.id, 'approved')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
              >
                Aprobar y Conceder Badge Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
