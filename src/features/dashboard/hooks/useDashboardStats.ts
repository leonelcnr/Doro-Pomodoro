import { useMemo, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Rangos de tiempo disponibles para las estadísticas del dashboard
export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'total';

// Estadísticas calculadas para un rango concreto. Los nombres de campos (y las
// claves internas name/minutes/value) son la forma de datos que consumen los
// gráficos (recharts) en el Dashboard, por eso se mantienen en inglés.
export interface RangeStats {
  chartData: { name: string; minutes: number }[];
  displayMinutes: number;
  avgSessionMinutes: number;
  displayCompletedTasks: number;
  pieChartData: { name: string; value: number }[];
}

// Agregados precalculados que devuelve la RPC `get_dashboard_aggregates`. Las
// claves van en inglés porque son los nombres de columna que emite la función SQL.
interface AgregadoPorHora {
  stat_date: string;
  stat_hour: number;
  total_minutes: number;
}

interface AgregadoPorDia {
  stat_date: string;
  day_of_week: number;
  total_minutes: number;
  sessions_count: number;
}

interface AgregadoPorTarea {
  stat_date: string;
  task_type: string | null;
  tasks_count: number;
}

interface AgregadosDashboard {
  hourly: AgregadoPorHora[];
  daily: AgregadoPorDia[];
  tasks: AgregadoPorTarea[];
  // Conteo histórico de sesiones (todo el tiempo). Lo usa el rango "Total"
  // para promediar contra total_study_minutes, ya que `daily` viene acotado
  // al último año y no representa el historial completo de sesiones.
  all_time_sessions: number;
}

/**
 * Hook que centraliza TODAS las estadísticas del dashboard. Trae los datos
 * crudos de Supabase (estadísticas del usuario, agregados precalculados por la
 * RPC y tareas recientes) con react-query + invalidación en tiempo real, y de
 * ahí deriva los datos listos para los gráficos de cada rango temporal.
 */
export function useDashboardStats(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fila de estadísticas globales del usuario (racha, minutos totales, etc.)
  const { data: datosEstadisticasUsuario } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // Agregados precalculados (por hora, por día y por tipo de tarea) vía RPC
  const { data: agregados, isLoading: cargandoAgregados } = useQuery({
    queryKey: ['dashboardAggregates', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('get_dashboard_aggregates', { p_user_id: userId });
      if (error) throw error;
      return data as AgregadosDashboard;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // Últimas tareas completadas (para el listado de "recientes")
  const { data: tareasRecientes, isLoading: cargandoTareas } = useQuery({
    queryKey: ['recentTasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('tasks')
        .select('id, header, type')
        .eq('user_id', userId)
        .eq('status', 'Completada')
        .order('id', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // Suscripciones en tiempo real con invalidación DEBOUNCED y SELECTIVA.
  //
  // Antes, cada evento (incluido reordenar tareas o cambios de prioridad)
  // disparaba un refetch inmediato de la RPC, que re-agrega el historial.
  // Ahora coalescemos las ráfagas: marcamos qué queries quedaron sucias y
  // las invalidamos una sola vez tras un período de calma.
  const refTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refSucias = useRef<{ agregados: boolean; userStats: boolean; tareas: boolean }>({
    agregados: false, userStats: false, tareas: false,
  });

  useEffect(() => {
    if (!userId) return;

    const sucias = refSucias.current;
    const RETARDO_MS = 800;

    const programarInvalidacion = () => {
      if (refTimeout.current) clearTimeout(refTimeout.current);
      refTimeout.current = setTimeout(() => {
        if (sucias.agregados) queryClient.invalidateQueries({ queryKey: ['dashboardAggregates', userId] });
        if (sucias.userStats) queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
        if (sucias.tareas) queryClient.invalidateQueries({ queryKey: ['recentTasks', userId] });
        sucias.agregados = false;
        sucias.userStats = false;
        sucias.tareas = false;
      }, RETARDO_MS);
    };

    const canal = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${userId}` }, () => {
        sucias.userStats = true;
        programarInvalidacion();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, () => {
        sucias.agregados = true;
        sucias.tareas = true;
        programarInvalidacion();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${userId}` }, () => {
        sucias.agregados = true;
        programarInvalidacion();
      })
      .subscribe();

    return () => {
      if (refTimeout.current) clearTimeout(refTimeout.current);
      supabase.removeChannel(canal);
    }
  }, [userId, queryClient]);

  // Precalcula los datos de los gráficos para TODOS los rangos de una sola vez
  const statsByRange = useMemo(() => {
    const rangos: TimeRange[] = ['day', 'week', 'month', 'year', 'total'];
    const resultado = {} as Record<TimeRange, RangeStats>;

    const rangoPorDefecto: RangeStats = { chartData: [], displayMinutes: 0, avgSessionMinutes: 0, displayCompletedTasks: 0, pieChartData: [] };

    if (!agregados) {
      rangos.forEach(r => { resultado[r] = { ...rangoPorDefecto }; });
      return resultado;
    }

    // Usamos la zona horaria de Argentina para definir "hoy" de forma consistente
    const hoyStrArg = new Date().toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).substring(0, 10);
    const hoyObj = new Date(hoyStrArg + 'T00:00:00');
    const mesesStr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const diasStr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    rangos.forEach(rango => {
      // Generamos las etiquetas del eje X según el rango y la fecha de inicio del período
      const etiquetas: string[] = [];
      const fechaInicio = new Date(hoyObj);

      if (rango === 'week') {
        fechaInicio.setDate(fechaInicio.getDate() - 6);
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoyObj);
          d.setDate(d.getDate() - i);
          etiquetas.push(diasStr[d.getDay()]);
        }
      } else if (rango === 'month') {
        fechaInicio.setDate(fechaInicio.getDate() - 29);
        for (let i = 29; i >= 0; i--) {
          const d = new Date(hoyObj);
          d.setDate(d.getDate() - i);
          etiquetas.push(`${d.getDate()}/${d.getMonth() + 1}`);
        }
      } else if (rango === 'year') {
        fechaInicio.setMonth(fechaInicio.getMonth() - 11);
        fechaInicio.setDate(1);
        for (let i = 11; i >= 0; i--) {
          const d = new Date(hoyObj);
          d.setMonth(d.getMonth() - i);
          etiquetas.push(mesesStr[d.getMonth()]);
        }
      } else if (rango === 'day') {
        for (let i = 0; i < 24; i++) {
          etiquetas.push(`${i.toString().padStart(2, '0')}:00`);
        }
      } else if (rango === 'total') {
        fechaInicio.setDate(fechaInicio.getDate() - 89);
        for (let i = 89; i >= 0; i--) {
          const d = new Date(hoyObj);
          d.setDate(d.getDate() - i);
          etiquetas.push(`${d.getDate()} ${mesesStr[d.getMonth()]}`);
        }
      }

      // Mapa etiqueta -> minutos acumulados, inicializado en 0 para cada etiqueta
      const mapaAgregado = new Map<string, number>();
      etiquetas.forEach(l => mapaAgregado.set(l, 0));

      let totalMinutos = 0;
      let totalSesiones = 0;

      if (rango === 'day') {
        // Para el día usamos el detalle por hora
        agregados.hourly.forEach((fila) => {
          if (fila.stat_date === hoyStrArg) {
            const etiqueta = `${fila.stat_hour.toString().padStart(2, '0')}:00`;
            if (mapaAgregado.has(etiqueta)) {
              mapaAgregado.set(etiqueta, (mapaAgregado.get(etiqueta) || 0) + fila.total_minutes);
            }
            totalMinutos += fila.total_minutes;
          }
        });
        totalSesiones = agregados.daily.find((d) => d.stat_date === hoyStrArg)?.sessions_count || 0;
      } else {
        // Para el resto de rangos usamos el detalle por día
        agregados.daily.forEach((fila) => {
          const fechaFila = new Date(fila.stat_date + 'T00:00:00');
          if (fechaFila >= fechaInicio || rango === 'total') {
            if (fechaFila >= fechaInicio) {
               let etiqueta = '';
               if (rango === 'week') etiqueta = diasStr[fila.day_of_week === 7 ? 0 : fila.day_of_week];
               else if (rango === 'month') etiqueta = `${fechaFila.getDate()}/${fechaFila.getMonth() + 1}`;
               else if (rango === 'year') etiqueta = mesesStr[fechaFila.getMonth()];
               else if (rango === 'total') etiqueta = `${fechaFila.getDate()} ${mesesStr[fechaFila.getMonth()]}`;

               if (mapaAgregado.has(etiqueta)) {
                 mapaAgregado.set(etiqueta, (mapaAgregado.get(etiqueta) || 0) + fila.total_minutes);
               }
            }
            totalMinutos += fila.total_minutes;
            totalSesiones += fila.sessions_count;
          }
        });
      }

      const datosGraficoFinal = Array.from(mapaAgregado, ([name, minutes]) => ({ name, minutes }));

      // Conteo de tareas completadas por tipo (para el gráfico de torta)
      const conteoTipos: Record<string, number> = {};
      let tareasMostradas = 0;
      agregados.tasks.forEach((t) => {
        const fechaTarea = new Date(t.stat_date + 'T00:00:00');
        if (fechaTarea >= fechaInicio || rango === 'total') {
           const tipoStr = t.task_type ? t.task_type.trim() : 'Otro';
           const tipo = tipoStr.charAt(0).toUpperCase() + tipoStr.slice(1);
           conteoTipos[tipo] = (conteoTipos[tipo] || 0) + t.tasks_count;
           tareasMostradas += t.tasks_count;
        }
      });

      const datosTorta = Object.entries(conteoTipos)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Para el total preferimos el acumulado oficial guardado en user_stats.
      // El conteo de sesiones sale de all_time_sessions (histórico real), ya
      // que `daily` está acotado al último año y subestimaría el divisor.
      if (rango === 'total' && datosEstadisticasUsuario) {
        totalMinutos = datosEstadisticasUsuario.total_study_minutes || 0;
        totalSesiones = agregados.all_time_sessions ?? agregados.daily.reduce((acc, val) => acc + val.sessions_count, 0);
      }

      resultado[rango] = {
        chartData: datosGraficoFinal,
        displayMinutes: totalMinutos,
        avgSessionMinutes: totalSesiones > 0 ? totalMinutos / totalSesiones : 0,
        displayCompletedTasks: tareasMostradas,
        pieChartData: datosTorta
      };
    });

    return resultado;
  }, [agregados, datosEstadisticasUsuario]);

  // Datos para el mapa de calor (minutos por día) y el promedio por día de la semana
  const { heatmapData, bestDaysData } = useMemo(() => {
    if (!agregados) return { heatmapData: [], bestDaysData: [] };

    const minutosDiarios = new Map<string, number>();
    const estadisticasDiasSemana = Array.from({ length: 7 }, () => ({ totalMins: 0, uniqueDays: new Set<string>() }));

    agregados.daily.forEach((fila) => {
      minutosDiarios.set(fila.stat_date, fila.total_minutes);

      // Convertimos el día de la semana (1-7) al formato de JS (0=domingo)
      const diaSemanaJs = fila.day_of_week === 7 ? 0 : fila.day_of_week;
      estadisticasDiasSemana[diaSemanaJs].totalMins += fila.total_minutes;
      estadisticasDiasSemana[diaSemanaJs].uniqueDays.add(fila.stat_date);
    });

    const datosMapaCalor = Array.from(minutosDiarios.entries()).map(([date, value]) => ({ date, value }));

    const etiquetasDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const datosMejoresDias = etiquetasDias.map((name, i) => {
      const est = estadisticasDiasSemana[i];
      const cantidadDias = est.uniqueDays.size || 1;
      return {
        name,
        avgMinutes: Math.round(est.totalMins / cantidadDias)
      };
    });

    return { heatmapData: datosMapaCalor, bestDaysData: datosMejoresDias };
  }, [agregados]);

  return {
    stats: {
      totalMinutes: datosEstadisticasUsuario?.total_study_minutes || 0,
      currentStreak: datosEstadisticasUsuario?.current_streak || 0,
      completedTasks: 0
    },
    recentTasks: tareasRecientes || [],
    statsByRange,
    heatmapData,
    bestDaysData,
    isLoading: cargandoAgregados || cargandoTareas
  };
}
