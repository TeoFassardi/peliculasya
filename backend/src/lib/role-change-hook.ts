import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api";

// El plugin admin sigue verificando permisos. Este hook limita los roles del proyecto
// e impide que un administrador se quite su propio acceso por error.
export const roleChangeHook = createAuthMiddleware(async (context) => {
  if (context.path !== "/admin/set-role") return;

  const session = await getAuthoritativeSessionFromCtx(context);
  if (!session || session.user.role !== "admin") return;

  const { role, userId } = context.body ?? {};
  if (role !== "admin" && role !== "user") {
    throw new APIError("BAD_REQUEST", {
      message: "El rol debe ser admin o user.",
    });
  }
  if (userId === session.user.id && role !== "admin") {
    throw new APIError("BAD_REQUEST", {
      message: "No podés quitarte tu propio acceso de administrador.",
    });
  }
});
