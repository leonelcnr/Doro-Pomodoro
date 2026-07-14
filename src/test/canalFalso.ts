import { vi } from "vitest";

/**
 * Cliente Supabase falso para tests de hooks realtime. Registra los handlers
 * que el hook pasa a `.on("postgres_changes", filtro, cb)` y permite simular
 * eventos de Postgres con `emitir(payload)`.
 *
 * Es un singleton a propósito: `vi.mock("@/lib/supabase", …)` necesita una
 * referencia estable importable desde la fábrica del mock.
 */

type ManejadorPostgres = (payload: unknown) => void;

export interface CanalFalso {
  nombre: string;
  manejadores: ManejadorPostgres[];
  on: (tipo: string, filtro: unknown, callback: ManejadorPostgres) => CanalFalso;
  subscribe: () => CanalFalso;
  /** Reparte un payload de postgres_changes a TODOS los handlers del canal. */
  emitir: (payload: unknown) => void;
}

const canales: CanalFalso[] = [];

function crearCanal(nombre: string): CanalFalso {
  const canal: CanalFalso = {
    nombre,
    manejadores: [],
    on(_tipo, _filtro, callback) {
      canal.manejadores.push(callback);
      return canal;
    },
    subscribe: () => canal,
    emitir(payload) {
      // Copia defensiva por si un handler se da de baja durante el reparto
      [...canal.manejadores].forEach((cb) => cb(payload));
    },
  };
  return canal;
}

export const clienteSupabaseFalso = {
  channel: vi.fn((nombre: string) => {
    const canal = crearCanal(nombre);
    canales.push(canal);
    return canal;
  }),
  removeChannel: vi.fn(),
};

/** Último canal creado por el hook bajo test. */
export function ultimoCanal(): CanalFalso {
  const canal = canales[canales.length - 1];
  if (!canal) throw new Error("No se creó ningún canal falso");
  return canal;
}

export function reiniciarCanalesFalsos(): void {
  canales.length = 0;
  clienteSupabaseFalso.channel.mockClear();
  clienteSupabaseFalso.removeChannel.mockClear();
}
