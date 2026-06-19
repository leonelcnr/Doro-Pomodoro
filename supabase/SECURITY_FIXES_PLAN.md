# Plan de remediación de seguridad — Pomodoro

Auditoría realizada sobre el proyecto Supabase `lqzkimyxgpklrfhiftnr` (2026-06-09).
Migración asociada: [`20260609000000_security_rls_hardening.sql`](./20260609000000_security_rls_hardening.sql).

**Decisión de diseño confirmada:** cualquier miembro de una sala puede sincronizar
`timer_state` y `music_state`; el resto de columnas de `rooms` (host_id, name, is_public)
solo las controla el host. La sincronización se hace por RPC `update_room_sync`.

---

## Problemas detectados y estado

| # | Severidad | Problema | Arreglo | Dónde |
|---|-----------|----------|---------|-------|
| C1 | 🔴 Crítico | `rooms` UPDATE abierto: `USING (auth.uid() IS NOT NULL)` permitía a cualquiera modificar cualquier sala (incl. `host_id`) | DROP policy insegura; sync solo por RPC | Migración §1, §2 |
| C2 | 🔴 Crítico | `rooms` SELECT abierto: cualquiera leía todas las salas privadas | DROP policy insegura + `rooms_select_member` | Migración §1 |
| C3 | 🔴 Crítico | `tasks` SELECT exponía las tareas de **todas** las salas | Policy basada en `room_members` | Migración §3 |
| C4 | 🔴 Crítico | IDOR: `get_dashboard_aggregates` / `get_study_stats` no validaban `p_user_id` vs `auth.uid()` | Validación + `search_path` | Migración §4 |
| A1 | 🟠 Importante | `tasks` UPDATE/DELETE sin `WITH CHECK` (reasignar dueño/sala) | Policies con `WITH CHECK` | Migración §3 |
| A2 | 🟠 Importante | `tasks` INSERT no validaba membresía a la sala | `tasks_insert_member` | Migración §3 |
| A3 | 🟠 Importante | Policies viejas duplicadas anulaban a las correctas en `rooms` | DROP de las viejas | Migración §1 |
| M1 | 🟡 Menor | `search_path` mutable en funciones SECURITY DEFINER/trigger | `SET search_path` | Migración §4, §5 |
| M2 | 🟡 Menor | `rls_auto_enable()` invocable por anon/authenticated vía REST | `REVOKE EXECUTE` | Migración §5 |
| M3 | 🟡 Menor | Leaked password protection desactivada | Activar en panel Auth (manual) | — |

---

## Checklist de ejecución

### Fase 1 — Base de datos (migración)
- [ ] **1.1** Revisar `20260609000000_security_rls_hardening.sql` (este PR).
- [ ] **1.2** Probar en entorno de staging / branch de Supabase, no directo en prod.
- [x] **1.3** Verificado el 2026-06-09: `hosts_sin_membresia = 0` y
      `tareas_sala_de_no_miembros = 0`. Ningún usuario real pierde acceso → **no hace falta backfill**.
- [ ] **1.4** Aplicar la migración (`supabase db push` o `supabase migration up`).
- [ ] **1.5** Re-correr el security advisor y confirmar que C1–C4 desaparecieron.

### Fase 2 — Frontend (depende de Fase 1 aplicada)
> ⚠️ Aplicar **después** de que `update_room_sync` exista en la base, o el timer/música romperán.

- [ ] **2.1** `src/features/timer/components/TimerDisplay.tsx` (~línea 72): reemplazar
      ```ts
      await supabase.from("rooms").update({ timer_state: newState }).eq("id", roomId);
      ```
      por
      ```ts
      await supabase.rpc("update_room_sync", { p_room_id: roomId, p_timer_state: newState });
      ```
- [ ] **2.2** `src/features/room/components/MusicPlayer.tsx` (~línea 170): reemplazar
      ```ts
      await supabase.from("rooms").update({ music_state: finalState }).eq("id", roomId);
      ```
      por
      ```ts
      await supabase.rpc("update_room_sync", { p_room_id: roomId, p_music_state: finalState });
      ```
- [ ] **2.3** Quitar el `alert()` de MusicPlayer (`:173`) y usar `toast` de sonner.
- [ ] **2.4** Para el dashboard: `get_dashboard_aggregates` sigue recibiendo `p_user_id`,
      que ya es el del propio usuario → sin cambios funcionales (solo ahora rechaza ajenos).

### Fase 3 — Verificación manual (post-aplicación)
- [ ] **3.1** Con 2 cuentas en una misma sala: ambas ven y sincronizan timer y música. ✅
- [ ] **3.2** Cuenta A intenta `update_room_sync` sobre una sala donde **no** es miembro → error. ✅
- [ ] **3.3** Cuenta A intenta leer `tasks` de una sala ajena vía API → 0 filas. ✅
- [ ] **3.4** Cuenta A llama `get_dashboard_aggregates` con el UUID de B → excepción "No autorizado". ✅
- [ ] **3.5** Activar **Leaked password protection** en el panel (Auth → Settings). (M3)

---

## Pendientes relacionados (fuera de esta migración)
Estos salieron en la revisión de código y conviene encararlos aparte:
- [ ] Unificar cliente Supabase duplicado (`src/config/supabase.ts` vs `src/lib/supabase.ts`).
- [ ] Sacar el `provider_refresh_token` de `user_metadata` (informe §1.1).
- [ ] Restringir CORS de la edge function `sync-calendar` (informe §1.4).
- [ ] Validar formato UUID de `roomId` antes de usarlo en queries (informe §1.5).
