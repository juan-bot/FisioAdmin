import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers, fetchAllAppointments, fetchAllPatients, fetchAllProgressRecords, approveUser, updateUserRole, deleteUserDoc, disableUser, enableUser, UserProfile } from '../../firebase/db';
import { UserMetrics } from '../dashboard/UserMetrics';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<UserProfile | null>(null);
  const [approveConfirm, setApproveConfirm] = useState<UserProfile | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{ user: UserProfile; newRole: UserProfile['role'] } | null>(null);
  const [disableConfirm, setDisableConfirm] = useState<UserProfile | null>(null);
  const [enableConfirm, setEnableConfirm] = useState<UserProfile | null>(null);
  const [selectedUserMetrics, setSelectedUserMetrics] = useState<UserProfile | null>(null);
  const [clinicData, setClinicData] = useState<{ patients: any[]; appointments: any[]; progress: any[] }>({ patients: [], appointments: [], progress: [] });

  const load = async () => {
    setLoading(true);
    try {
      const [userData, patients, appointments, progress] = await Promise.all([fetchUsers(), fetchAllPatients(), fetchAllAppointments(), fetchAllProgressRecords()]);
      setUsers(userData);
      setClinicData({ patients, appointments, progress });
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchUsers(), fetchAllPatients(), fetchAllAppointments(), fetchAllProgressRecords()])
      .then(([userData, patients, appointments, progress]) => { if (active) { setUsers(userData); setClinicData({ patients, appointments, progress }); } })
      .catch(() => { if (active) setError('No se pudieron cargar los usuarios.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const therapistMetrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return users.reduce<Record<string, { patients: number; completed: number; upcoming: number; documented: number; recovery: number; lastSession: string }>>((result, user) => {
      const appointments = clinicData.appointments.filter(appointment => appointment.therapistId === user.uid);
      const completed = appointments.filter(appointment => appointment.status === 'completed');
      const progress = clinicData.progress.filter(record => record.therapistId === user.uid);
      const recovery = progress.length ? Math.round(progress.reduce((sum, record) => sum + (record.mobilityScore + record.strengthScore + record.functionalScore) / 3, 0) / progress.length) : 0;
      const lastSession = completed.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.date || '';
      result[user.uid] = {
        patients: clinicData.patients.filter(patient => patient.therapistId === user.uid && patient.status === 'active').length,
        completed: completed.length,
        upcoming: appointments.filter(appointment => appointment.date >= today && ['scheduled', 'confirmed'].includes(appointment.status)).length,
        documented: completed.filter(appointment => appointment.sessionNote).length,
        recovery,
        lastSession,
      };
      return result;
    }, {});
  }, [users, clinicData]);

  const handleApprove = (user: UserProfile) => {
    setApproveConfirm(user);
  };

  const confirmApprove = async () => {
    if (!approveConfirm) return;
    await approveUser(approveConfirm.uid);
    load();
    setApproveConfirm(null);
  };

  const handleRole = (user: UserProfile, newRole: UserProfile['role']) => {
    if (user.role === newRole) return;
    setRoleConfirm({ user, newRole });
  };

  const confirmRole = async () => {
    if (!roleConfirm) return;
    await updateUserRole(roleConfirm.user.uid, roleConfirm.newRole);
    load();
    setRoleConfirm(null);
  };

  const handleDelete = (user: UserProfile) => {
    if (user.uid === profile?.uid) return;
    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteUserDoc(deleteConfirm.uid);
    load();
    setDeleteConfirm(null);
  };

  const handleDisable = (user: UserProfile) => {
    if (user.uid === profile?.uid) return;
    setDisableConfirm(user);
  };

  const confirmDisable = async () => {
    if (!disableConfirm) return;
    await disableUser(disableConfirm.uid);
    load();
    setDisableConfirm(null);
  };

  const handleEnable = (user: UserProfile) => {
    setEnableConfirm(user);
  };

  const confirmEnable = async () => {
    if (!enableConfirm) return;
    await enableUser(enableConfirm.uid);
    load();
    setEnableConfirm(null);
  };

  const StatusBadge = ({ approved, disabled }: { approved: boolean; disabled?: boolean }) => {
    if (disabled) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          Deshabilitado
        </span>
      );
    }
    return approved ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-light text-secondary-dark">
        Aprobado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">
        Pendiente
      </span>
    );
  };

  const RoleSelect = ({ u, onChange }: { u: UserProfile; onChange: (user: UserProfile, role: UserProfile['role']) => void }) => (
    <select
      value={u.role}
      disabled={u.uid === profile?.uid}
      onChange={e => onChange(u, e.target.value as UserProfile['role'])}
      className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="admin">Administrador</option>
      <option value="therapist">Terapeuta</option>
      <option value="pending">Pendiente</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona el acceso al sistema. Solo los usuarios aprobados pueden iniciar sesión.
        </p>
      </div>

      {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
          No hay usuarios registrados.
        </div>
      ) : (
        <>
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
               <thead className="bg-gray-50 text-gray-500">
                 <tr>
                   <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Nombre</th>
                   <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Correo</th>
                   <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Rol</th>
                   <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Estado</th>
                   <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Desempeño clínico</th>
                   <th className="text-right font-medium px-4 py-3 whitespace-nowrap">Acciones</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.uid}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.displayName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3"><RoleSelect u={u} onChange={handleRole} /></td>
                    <td className="px-4 py-3"><StatusBadge approved={u.approved} disabled={u.disabled} /></td>
                    <td className="px-4 py-3">{u.role === 'therapist' ? <div className="min-w-[220px]"><div className="grid grid-cols-3 gap-2 text-center"><span className="rounded-lg bg-primary-lighter px-2 py-1 text-xs font-bold text-primary-dark">{therapistMetrics[u.uid]?.patients || 0}<small className="ml-1 font-medium text-slate-500">pac.</small></span><span className="rounded-lg bg-secondary-light px-2 py-1 text-xs font-bold text-secondary-dark">{therapistMetrics[u.uid]?.completed || 0}<small className="ml-1 font-medium text-slate-500">ses.</small></span><span className="rounded-lg bg-accent-light px-2 py-1 text-xs font-bold text-accent-hover">{therapistMetrics[u.uid]?.recovery || 0}%<small className="ml-1 font-medium text-slate-500">rec.</small></span></div><p className="mt-1 text-xs text-slate-400">{therapistMetrics[u.uid]?.documented || 0}/{therapistMetrics[u.uid]?.completed || 0} sesiones documentadas</p></div> : <span className="text-xs text-gray-400">—</span>}</td>
<td className="px-4 py-3 text-right whitespace-nowrap">
                        {!u.approved && (
                          <button
                            onClick={() => handleApprove(u)}
                            className="text-sm text-primary hover:underline font-medium mr-3"
                          >
                            Aprobar
                          </button>
                        )}
                        {!u.disabled && u.uid !== profile?.uid && (
                          <button
                            onClick={() => handleDisable(u)}
                            className="text-sm text-secondary hover:underline font-medium mr-3"
                          >
                            Deshabilitar
                          </button>
                        )}
                        {u.disabled && u.uid !== profile?.uid && (
                          <button
                            onClick={() => handleEnable(u)}
                            className="text-sm text-secondary hover:underline font-medium mr-3"
                          >
                            Habilitar
                          </button>
                        )}
                        {u.uid !== profile?.uid && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-sm text-danger hover:underline font-medium mr-3"
                          >
                            Eliminar
                          </button>
                        )}
                        {u.role === 'therapist' && (
                          <button
                            onClick={() => setSelectedUserMetrics(u)}
                            className="text-sm text-info hover:underline font-medium mr-3"
                          >
                            Ver Métricas
                          </button>
                        )}
                      </td>
                  </tr>
                ))}
              </tbody>
             </table>
           </div>
         </div>

          {selectedUserMetrics && (
            <UserMetrics therapistId={selectedUserMetrics.uid} therapistName={selectedUserMetrics.displayName} />
          )}

          <div className="sm:hidden space-y-3">
            {users.map(u => (
              <div key={u.uid} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <StatusBadge approved={u.approved} disabled={u.disabled} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Rol</span>
                  <RoleSelect u={u} onChange={handleRole} />
                </div>
                {u.role === 'therapist' && <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800"><div><p className="text-lg font-bold text-primary">{therapistMetrics[u.uid]?.patients || 0}</p><p className="text-[10px] text-slate-500">Pacientes</p></div><div><p className="text-lg font-bold text-secondary-dark">{therapistMetrics[u.uid]?.completed || 0}</p><p className="text-[10px] text-slate-500">Sesiones</p></div><div><p className="text-lg font-bold text-accent-hover">{therapistMetrics[u.uid]?.recovery || 0}%</p><p className="text-[10px] text-slate-500">Recuperación</p></div></div>}
<div className="flex gap-2 pt-1">
                  {!u.approved && (
                    <button
                      onClick={() => handleApprove(u)}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Aprobar
                    </button>
                  )}
                  {!u.disabled && u.uid !== profile?.uid && (
                    <button
                      onClick={() => handleDisable(u)}
                      className="flex-1 py-2 bg-secondary hover:bg-secondary-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Deshabilitar
                    </button>
                  )}
                  {u.disabled && u.uid !== profile?.uid && (
                    <button
                      onClick={() => handleEnable(u)}
                      className="flex-1 py-2 bg-secondary hover:bg-secondary-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Habilitar
                    </button>
                  )}
                  {u.uid !== profile?.uid && (
                    <button
                      onClick={() => handleDelete(u)}
                      className="flex-1 py-2 border border-danger text-danger text-sm font-medium rounded-lg hover:bg-danger-light transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                  {u.role === 'therapist' && (
                    <button
                      onClick={() => setSelectedUserMetrics(u)}
                      className="flex-1 py-2 bg-info hover:bg-info-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Ver Métricas
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={!!approveConfirm} onClose={() => setApproveConfirm(null)} title="Aprobar usuario" size="sm">
        <p className="text-gray-700">
          ¿Aprobar a <strong>{approveConfirm?.displayName}</strong> ({approveConfirm?.email})?
        </p>
        <p className="text-sm text-gray-500 mt-2">Podrá iniciar sesión en el sistema.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setApproveConfirm(null)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmApprove}>Aprobar</Button>
        </div>
      </Modal>

      <Modal isOpen={!!roleConfirm} onClose={() => setRoleConfirm(null)} title="Cambiar rol" size="sm">
        <p className="text-gray-700">
          ¿Cambiar rol de <strong>{roleConfirm?.user.displayName}</strong> a <strong>{roleConfirm?.newRole}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRoleConfirm(null)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmRole}>Cambiar</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar usuario" size="sm">
        <p className="text-gray-700">
          ¿Eliminar a <strong>{deleteConfirm?.displayName}</strong> ({deleteConfirm?.email})?
        </p>
        <p className="text-sm text-danger mt-2">
          <strong>Esta acción es irreversible.</strong> Se eliminarán también sus recetas, citas y registros de progreso.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete}>Eliminar todo</Button>
        </div>
      </Modal>

      <Modal isOpen={!!disableConfirm} onClose={() => setDisableConfirm(null)} title="Deshabilitar usuario" size="sm">
        <p className="text-gray-700">
          ¿Deshabilitar a <strong>{disableConfirm?.displayName}</strong> ({disableConfirm?.email})?
        </p>
        <p className="text-sm text-secondary mt-2">
          No podrá iniciar sesión, pero se conservarán todos sus datos (recetas, citas, progresos).
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDisableConfirm(null)}>Cancelar</Button>
          <Button variant="secondary" onClick={confirmDisable}>Deshabilitar</Button>
        </div>
      </Modal>

      <Modal isOpen={!!enableConfirm} onClose={() => setEnableConfirm(null)} title="Habilitar usuario" size="sm">
        <p className="text-gray-700">
          ¿Habilitar a <strong>{enableConfirm?.displayName}</strong> ({enableConfirm?.email})?
        </p>
        <p className="text-sm text-secondary mt-2">
          Podrá volver a iniciar sesión con normalidad.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEnableConfirm(null)}>Cancelar</Button>
          <Button variant="secondary" onClick={confirmEnable}>Habilitar</Button>
        </div>
      </Modal>
    </div>
  );
}
