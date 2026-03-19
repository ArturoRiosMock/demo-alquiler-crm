"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { upsertComprador } from "@/app/actions/compradores";

// ── Dev-only hardcoded users (no Supabase needed) ──
const DEV_USERS: Record<string, { password: string; role: string; nombre: string }> = {
  "admin@propcrm.com": { password: "Admin1234!", role: "admin", nombre: "Administrador" },
  "cliente@propcrm.com": { password: "Cliente1234!", role: "cliente", nombre: "Cliente Demo" },
};

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "";

  const devUser = DEV_USERS[email];
  if (!devUser || devUser.password !== password) {
    return { error: "Credenciales incorrectas" };
  }

  const cookieStore = await cookies();
  cookieStore.set("dev-auth", JSON.stringify({ email, role: devUser.role, nombre: devUser.nombre }), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
  });
  const dest = redirectTo || (devUser.role === "admin" ? "/admin" : "/portal/privado");
  redirect(dest);
}

export async function signUp(formData: FormData): Promise<{ error?: string; success?: string }> {
  const email = formData.get("email") as string;
  const nombre = (formData.get("nombre") as string) || "";
  const tel = (formData.get("tel") as string) || "";

  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const compradorId = crypto.randomUUID();

  try {
    // Create dev-auth cookie
    const cookieStore = await cookies();
    cookieStore.set("dev-auth", JSON.stringify({ email, role: "cliente", nombre }), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
    });

    // Create comprador record via server action
    await upsertComprador({
      id: compradorId,
      nombre,
      ini: initials || "??",
      col: "",
      tipo: "Privado",
      agente: "",
      email,
      tel,
      intereses: "",
      presupuesto: "",
      activos: "",
      actividad: "",
      estado: "Nuevo",
      estadoC: "fp-nd",
      nda: "Pendiente",
    });

    return { success: "Cuenta creada correctamente. Bienvenido a PropCRM." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear la cuenta" };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("dev-auth");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("dev-auth")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
