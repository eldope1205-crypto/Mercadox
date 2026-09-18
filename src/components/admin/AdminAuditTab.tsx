import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface AdminAuditTabProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = async (actionFilter?: string) => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs(actionFilter ? { action: actionFilter } : undefined);
      setLogs(res.auditLogs || []);
    } catch (err: any) {
      onNotify(err.message || 'Error al cargar bitácora de auditoría', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(filterAction);
  }, [filterAction]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Registro Inmutable de Auditoría del Sistema</span>
          </h2>
          <p className="text-xs text-slate-500">
            Trazabilidad completa y permanente de todas las intervenciones del administrador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filtrar por acción..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <button
            onClick={() => loadLogs(filterAction)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando registros auditados...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se han encontrado registros en la bitácora con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Administrador</th>
                  <th className="py-3 px-4">Acción Ejecutada</th>
                  <th className="py-3 px-4">Destino / Entidad</th>
                  <th className="py-3 px-4">Detalles / Justificación</th>
                  <th className="py-3 px-4">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 font-mono text-[11px]">
                    <td className="py-3 px-4 text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-bold">
                      {log.adminEmail}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {log.targetType ? `${log.targetType} (${log.targetId?.substring(0, 8) || '—'})` : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-sans max-w-sm truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
