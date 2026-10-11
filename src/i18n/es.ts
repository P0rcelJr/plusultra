// Single-locale UI copy (es-UY). Code stays in English; every user-facing string lives here
// so a second locale later means adding a sibling file, not hunting through components.
export const es = {
  app: {
    name: "Plus Ultra",
    tagline: "Gestión del gimnasio",
  },
  auth: {
    loginTitle: "Iniciar sesión",
    email: "Email",
    password: "Contraseña",
    submit: "Entrar",
    submitting: "Entrando…",
    invalidCredentials: "Email o contraseña incorrectos.",
    logout: "Cerrar sesión",
  },
  roles: {
    ADMIN: "Administrador",
    COACH: "Coach",
    MEMBER: "Socio",
  },
  status: {
    PENDING: "Pendiente de aprobación",
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
  },
  home: {
    admin: "Panel de administración",
    coach: "Panel de coach",
    member: "Mi cuenta",
    greeting: "Hola, {name}",
    skeletonNotice:
      "Esqueleto funcional: autenticación y base de datos listas. Las secciones llegan en las próximas fases.",
  },
} as const;

export type Messages = typeof es;

/** Replaces `{key}` placeholders in a message with the given values. */
export function fill(message: string, values: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
