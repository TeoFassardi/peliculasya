import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { signUp, useSession } from "../lib/auth-client";
import { FormField } from "../components/FormField";
import { getErrorMessage } from "../lib/api";

export function Register() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  if (isPending) return <p role="status">Verificando sesión…</p>;
  if (session) return <Navigate to="/" replace />;

  async function submit(values: RegisterFormValues) {
    try {
      const { error } = await signUp.email(values);
      if (error) {
        setError("root", {
          message: error.message ?? "No pudimos crear la cuenta. Intentá nuevamente.",
        });
        return;
      }
      navigate("/", { replace: true });
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <section className="auth-panel">
      <h1>Tu próxima historia.</h1>
      <p className="muted">Creá tu cuenta para entrar a PeliculasYa.</p>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={isSubmitting} className="form-fields">
          <FormField label="Nombre" name="name" error={errors.name?.message}>
            <input
              id="name"
              autoComplete="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </FormField>
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
          <FormField
            label="Contraseña"
            name="password"
            error={errors.password?.message}
            hint="Usá entre 8 y 128 caracteres."
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
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
            {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </fieldset>
      </form>
      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
      </p>
    </section>
  );
}
