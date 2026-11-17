import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { signIn, useSession } from "../lib/auth-client";
import { FormField } from "../components/FormField";
import { getErrorMessage } from "../lib/api";

export function Login() {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [socialPending, setSocialPending] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const intendedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const from = intendedPath?.startsWith("/") && !intendedPath.startsWith("//") ? intendedPath : "/";
  const oauthFailed = new URLSearchParams(location.search).has("error");

  if (isPending) return <p role="status">Verificando sesión…</p>;
  if (session && !isSubmitting) return <Navigate to={from} replace />;

  async function submit(values: LoginFormValues) {
    try {
      const { error } = await signIn.email(values);
      if (error) {
        setError("root", { message: "No pudimos ingresar. Revisá tu email y contraseña." });
        return;
      }
      navigate(from, { replace: true });
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  }

  async function githubLogin() {
    setSocialPending(true);
    try {
      const { error } = await signIn.social({
        provider: "github",
        callbackURL: from,
        errorCallbackURL: "/login",
      });
      if (error)
        setError("root", { message: "No pudimos conectar con GitHub. Intentá nuevamente." });
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    } finally {
      setSocialPending(false);
    }
  }

  return (
    <section className="auth-panel">
      <h1>Volvé a las historias.</h1>
      <p className="muted">Ingresá a tu cuenta de PeliculasYa.</p>
      {oauthFailed && (
        <p className="field-error" role="alert">
          No se pudo completar el ingreso con GitHub. Volvé a intentar o ingresá con email.
        </p>
      )}
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={isSubmitting || socialPending} className="form-fields">
          <FormField label="Email" name="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </FormField>
          <FormField label="Contraseña" name="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
          </FormField>
          {errors.root && (
            <p className="field-error" role="alert">
              {errors.root.message}
            </p>
          )}
          <button className="button" type="submit">
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </button>
        </fieldset>
      </form>
      <div className="auth-divider">o continuá con</div>
      <button
        className="button secondary full-width"
        disabled={socialPending || isSubmitting}
        onClick={githubLogin}
      >
        {socialPending ? "Conectando…" : "Ingresar con GitHub"}
      </button>
      <p className="auth-switch">
        ¿Primera vez? <Link to="/register">Crear cuenta</Link>
      </p>
    </section>
  );
}
