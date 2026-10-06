import { beforeEach, describe, expect, it, vi } from "vitest";
import { asegurarSesion, cerrarEntradaPendiente, entrarCon, resolverRegresoOAuth, rutaSegura } from "./authHelpers";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

const funciones = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ default: { auth, functions: funciones } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function conSesion(sesion: { access_token?: string; user: { id: string; is_anonymous: boolean } } | null) {
  auth.getSession.mockResolvedValue({ data: { session: sesion } });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  auth.signInAnonymously.mockResolvedValue({ data: { user: { id: "anon-1" } }, error: null });
  auth.linkIdentity.mockResolvedValue({ error: null });
  auth.signInWithOAuth.mockResolvedValue({ error: null });
  funciones.invoke.mockResolvedValue({ error: null });
  window.history.replaceState(null, "", "/");
});

describe("asegurarSesion", () => {
  it("usa la sesión que ya hay, sin crear otra", async () => {
    conSesion({ user: { id: "u-1", is_anonymous: false } });
    await expect(asegurarSesion()).resolves.toBe("u-1");
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("sin sesión, crea una sola anónima aunque la pidan varios a la vez", async () => {
    conSesion(null);
    const ids = await Promise.all([asegurarSesion(), asegurarSesion(), asegurarSesion()]);
    expect(ids).toEqual(["anon-1", "anon-1", "anon-1"]);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("anon_name")).toBe("Anónimo");
  });
});

describe("rutaSegura", () => {
  it("deja pasar solo rutas internas", () => {
    expect(rutaSegura("/room/abc")).toBe("/room/abc");
    expect(rutaSegura("//otro.sitio")).toBe("/");
    expect(rutaSegura("https://otro.sitio")).toBe("/");
    expect(rutaSegura(null)).toBe("/");
  });
});

describe("entrar con un proveedor", () => {
  it("el anónimo vincula; sin sesión, entra", async () => {
    conSesion({ user: { id: "anon-1", is_anonymous: true } });
    await entrarCon("github", "/dashboard");
    expect(auth.linkIdentity).toHaveBeenCalledOnce();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();

    conSesion(null);
    await entrarCon("github", "/dashboard");
    expect(auth.signInWithOAuth).toHaveBeenCalledOnce();
  });

  it("si la cuenta ya existía, entra a ella y le suma lo del anónimo una sola vez", async () => {
    conSesion({ access_token: "token-anon", user: { id: "anon-1", is_anonymous: true } });
    await entrarCon("google", "/dashboard");

    window.history.replaceState(null, "", "/?error_code=identity_already_exists");
    resolverRegresoOAuth();
    await vi.waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalledOnce());
    expect(window.location.search).toBe("");

    // Supabase avisa dos veces de la sesión: se suma una sola vez
    const [primero, segundo] = await Promise.all([cerrarEntradaPendiente(), cerrarEntradaPendiente()]);
    expect(primero).toEqual({ volverA: "/dashboard", sumado: true });
    expect(segundo).toBeNull();
    expect(funciones.invoke).toHaveBeenCalledExactlyOnceWith("sumar-anonimo", {
      body: { token_anonimo: "token-anon" },
    });
  });

  it("si sumar falla, igual entra y vuelve", async () => {
    conSesion({ access_token: "token-anon", user: { id: "anon-1", is_anonymous: true } });
    await entrarCon("github", "/");
    window.history.replaceState(null, "", "/#error_code=identity_already_exists");
    resolverRegresoOAuth();
    await vi.waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalledOnce());

    funciones.invoke.mockResolvedValue({ error: new Error("410") });
    await expect(cerrarEntradaPendiente()).resolves.toEqual({ volverA: "/", sumado: false });
  });

  it("vincular o entrar con cuenta nueva no llama a sumar", async () => {
    conSesion({ user: { id: "anon-1", is_anonymous: true } });
    await entrarCon("discord", "/room/x");
    await expect(cerrarEntradaPendiente()).resolves.toEqual({ volverA: "/room/x", sumado: false });
    expect(funciones.invoke).not.toHaveBeenCalled();
  });
});
