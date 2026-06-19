// Tipos de dominio compartidos de la app (usuarios, tareas, presencia, reloj).
//
// Centralizados aquí para que la UI, los hooks y los servicios compartan UN solo
// contrato y no se repitan interfaces ni se use `any` (problemas 2.6 y 2.7 del
// plan de componentización: tipos duplicados/divergentes y uso extendido de `any`).
//
// Convención de la app: las CLAVES en inglés (`room_id`, `user_id`, `header`…)
// son columnas reales de Supabase y se mantienen tal cual; la traducción al
// español vive en los nombres de variables/funciones, no en estos contratos.

import type { Modo } from "@/types/timer";

/**
 * Metadatos crudos del usuario que entrega Supabase (`user_metadata`). Dependen
 * del proveedor OAuth, por eso se tipan de forma laxa; solo nombramos los campos
 * que la app realmente lee como respaldo de `name`/`avatar_url`.
 */
export interface UsuarioMetadata {
  name?: string;
  avatar_url?: string;
  provider_refresh_token?: string;
  [clave: string]: unknown;
}

/**
 * Usuario autenticado tal como lo expone el `AuthContext`, ya mapeado desde la
 * sesión de Supabase (ver `mapearUsuario` en `authHelpers`). Aísla acá los
 * nombres de Supabase para que la UI no dependa de la forma cruda de la sesión.
 */
export interface Usuario {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  isAnonymous: boolean;
  provider_token: string | null;
  // Algunos consumidores de plantilla (app-sidebar) leen estos metadatos como
  // respaldo; en runtime suelen venir "aplanados" al nivel superior.
  user_metadata?: UsuarioMetadata;
}

/**
 * Vista mínima de un usuario presente en una sala (viaja por el canal de
 * presencia en tiempo real). Es distinta del `Usuario` autenticado: solo lleva
 * lo necesario para pintar el avatar.
 */
export interface UsuarioEnSala {
  id: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Tarea persistida en la tabla `tasks` de Supabase.
 *
 * Coincide estructuralmente con el `schema` (zod) que valida el `DataTable` en
 * runtime; los campos opcionales incluyen `| undefined` a propósito para reflejar
 * el `.optional()` de zod bajo `exactOptionalPropertyTypes` y poder fluir en
 * ambos sentidos UI ↔ servicio sin casts.
 */
export interface Tarea {
  id: number;
  header: string;        // Título de la tarea
  type: string;          // Tipo/categoría
  status: string;        // "Completada" | "En Progreso" | "Sin Empezar"
  limit?: string | undefined;
  favorite?: boolean | undefined;
  priority?: string | undefined;
  room_id?: string | null | undefined;        // null si es personal; id de sala si no
  user_id?: string | undefined;               // dueño de la tarea
  order_index?: number | null | undefined;    // índice para el ordenamiento manual
  description?: string | undefined;
}

/**
 * Carga útil para crear/actualizar tareas (un subconjunto de `Tarea`). Las altas
 * todavía no tienen `id` real; el upsert/insert completa el resto.
 */
export type TareaPayload = Partial<Tarea>;

/**
 * Estado del reloj compartido de una sala (columna `timer_state`). Es el objeto
 * que se sincroniza entre clientes vía Supabase y que consume el store.
 */
export interface EstadoReloj {
  tiempoRestante: number;
  estaActivo: boolean;
  modo: Modo;
  actualizadoEn?: string;
}

/**
 * Invitación vigente de una sala (tabla `room_invites`). Las claves van en inglés
 * porque son columnas reales de Supabase.
 */
export interface Invitacion {
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
}

/**
 * Estado de la música compartida de una sala (columna `music_state`). Las claves
 * `url`/`isPlaying` se mantienen en inglés porque viajan tal cual en la columna.
 */
export interface EstadoMusicaSala {
  url: string;
  isPlaying: boolean;
  updatedAt?: string;
}
