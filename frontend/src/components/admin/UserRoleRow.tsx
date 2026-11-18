import { useState } from "react";
import type { ManagedUser } from "../../types/user";
import type { UserRole } from "../../types/auth";

interface UserRoleRowProps {
  user: ManagedUser;
  currentUserId: string;
  busy: boolean;
  onSave: (user: ManagedUser, role: UserRole) => Promise<void>;
}

export function UserRoleRow({ user, currentUserId, busy, onSave }: UserRoleRowProps) {
  const [role, setRole] = useState<UserRole>(user.role === "admin" ? "admin" : "user");
  const ownAccount = user.id === currentUserId;
  return (
    <li className="user-role-row">
      <div className="user-identity">
        <h2>
          {user.name}
          {ownAccount && <span className="muted"> (vos)</span>}
        </h2>
        <p className="muted">{user.email}</p>
        <p className="role-current">
          Rol actual: {user.role === "admin" ? "Administrador" : "Usuario"}
        </p>
      </div>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(user, role);
        }}
      >
        <label htmlFor={`role-${user.id}`}>Rol de {user.name}</label>
        <div className="role-controls">
          <select
            id={`role-${user.id}`}
            value={role}
            disabled={busy || ownAccount}
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            className="button secondary"
            type="submit"
            disabled={busy || ownAccount || role === user.role}
          >
            Guardar rol
          </button>
        </div>
        {ownAccount && (
          <p className="field-hint">Tu propio rol se conserva para mantener tu acceso.</p>
        )}
      </form>
    </li>
  );
}
