import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers, approveUser, updateUserRole, deleteUserDoc, UserProfile } from '../../firebase/db';

export function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleApprove = async (uid: string) => {
    await approveUser(uid);
    load();
  };

  const handleRole = async (uid: string, role: UserProfile['role']) => {
    await updateUserRole(uid, role);
    load();
  };

  const handleDelete = async (uid: string) => {
    if (uid === profile?.uid) return;
    await deleteUserDoc(uid);
    load();
  };

  const StatusBadge = ({ approved }: { approved: boolean }) =>
    approved ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-light text-secondary-dark">
        Aprobado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">
        Pendiente
      </span>
    );

  const RoleSelect = ({ u }: { u: UserProfile }) => (
    <select
      value={u.role}
      disabled={u.uid === profile?.uid}
      onChange={e => handleRole(u.uid, e.target.value as UserProfile['role'])}
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
                    <td className="px-4 py-3"><RoleSelect u={u} /></td>
                    <td className="px-4 py-3"><StatusBadge approved={u.approved} /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!u.approved && (
                        <button
                          onClick={() => handleApprove(u.uid)}
                          className="text-sm text-primary hover:underline font-medium mr-3"
                        >
                          Aprobar
                        </button>
                      )}
                      {u.uid !== profile?.uid && (
                        <button
                          onClick={() => handleDelete(u.uid)}
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
                  <StatusBadge approved={u.approved} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Rol</span>
                  <RoleSelect u={u} />
                </div>
                <div className="flex gap-2 pt-1">
                  {!u.approved && (
                    <button
                      onClick={() => handleApprove(u.uid)}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Aprobar
                    </button>
                  )}
                  {u.uid !== profile?.uid && (
                    <button
                      onClick={() => handleDelete(u.uid)}
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
    </div>
  );
}
