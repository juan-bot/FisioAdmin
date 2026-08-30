import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers, approveUser, updateUserRole, deleteUserDoc, disableUser, enableUser, softDeleteUser, UserProfile } from '../../firebase/db';
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

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3">Correo</th>
                  <th className="text-left font-medium px-4 py-3">Rol</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.uid}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.displayName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3"><RoleSelect u={u} onChange={handleRole} /></td>
                    <td className="px-4 py-3"><StatusBadge approved={u.approved} disabled={u.disabled} /></td>
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
                          className="text-sm text-danger hover:underline font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
