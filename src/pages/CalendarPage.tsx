import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Check, Loader2, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState, useCallback, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddEventForm } from "@/features/calendar/components/AddEventForm";
import { useCalendarEvents } from "@/features/calendar/useCalendarEvents";
import type { CalendarEvent, EventType } from "@/features/calendar/calendarService";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/context/useAuth";

// Color/estilo de la etiqueta según el tipo de evento (las claves son valores de EventType)
const COLOR_TIPO_EVENTO: Record<EventType, string> = {
  Examen: "bg-red-500/15 text-red-400 border-red-500/30",
  Entrega: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Estudio: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Otro: "bg-muted text-muted-foreground border-border",
};

/**
 * Página del Calendario: muestra un calendario mensual y la lista de próximos
 * eventos, permite crear/editar/eliminar eventos y conectar Google Calendar.
 * La lógica de datos vive en el hook useCalendarEvents.
 */
export default function CalendarPage() {
  const { user, connectGoogleCalendar, hasGoogleLinked } = useAuth();
  const tieneTokenCalendario = !!user?.provider_token;

  const [fecha, establecerFecha] = useState<Date | undefined>(new Date());
  const [abiertoAgregarEvento, establecerAbiertoAgregarEvento] = useState(false);
  const [abiertoDetalleDia, establecerAbiertoDetalleDia] = useState(false);
  const [diaSeleccionado, establecerDiaSeleccionado] = useState<Date | undefined>(undefined);
  const [eventoEnEdicion, establecerEventoEnEdicion] = useState<CalendarEvent | undefined>(undefined);
  const [abiertoEditar, establecerAbiertoEditar] = useState(false);
  const [conectando, establecerConectando] = useState(false);

  const { eventos, cargando, crearEvento, actualizarEvento, eliminarEvento } = useCalendarEvents(
    hasGoogleLinked
  );

  // Lanza el flujo de conexión con Google Calendar (redirige fuera de la app)
  const manejarConectarGoogle = useCallback(async () => {
    establecerConectando(true);
    try {
      await connectGoogleCalendar();
      // El flujo redirige a /calendar — el estado de carga se resuelve solo
    } catch {
      establecerConectando(false);
    }
  }, [connectGoogleCalendar]);

  // ── Manejadores ────────────────────────────────────────────

  const manejarSeleccionarFecha = useCallback((nuevaFecha: Date | undefined) => {
    establecerFecha((previa) => {
      if (nuevaFecha && previa && nuevaFecha.toDateString() === previa.toDateString()) return previa;
      return nuevaFecha;
    });
  }, []);

  const manejarDobleClickDia = useCallback((dia: Date, e: React.MouseEvent) => {
    e.preventDefault();
    establecerDiaSeleccionado(dia);
    establecerFecha((previa) => {
      if (previa && dia.toDateString() === previa.toDateString()) return previa;
      return dia;
    });
    establecerAbiertoDetalleDia(true);
  }, []);

  const manejarAgregarEventoDesdeDetalle = () => {
    establecerAbiertoDetalleDia(false);
    establecerAbiertoAgregarEvento(true);
  };

  const manejarClickEvento = (evento: CalendarEvent) => {
    establecerEventoEnEdicion(evento);
    establecerAbiertoEditar(true);
    establecerAbiertoDetalleDia(false);
  };

  // ── Callbacks de envío del formulario ──────────────────────

  // Mapea los valores del formulario al formato de la base (event_date) y crea el evento
  const manejarEnviarCrear = useCallback(
    async (valores: { title: string; date: Date; type: EventType; description?: string }) => {
      await crearEvento({
        title: valores.title,
        event_date: format(valores.date, "yyyy-MM-dd"),
        type: valores.type,
        description: valores.description,
      });
    },
    [crearEvento]
  );

  const manejarEnviarEditar = useCallback(
    async (
      valores: { title: string; date: Date; type: EventType; description?: string },
      id?: string
    ) => {
      if (!id) return;
      await actualizarEvento(id, {
        title: valores.title,
        event_date: format(valores.date, "yyyy-MM-dd"),
        type: valores.type,
        description: valores.description,
      });
    },
    [actualizarEvento]
  );

  const manejarEliminar = useCallback(
    async (id: string) => {
      await eliminarEvento(id);
    },
    [eliminarEvento]
  );

  // ── Datos derivados ────────────────────────────────────────

  const widgetCalendario = useMemo(
    () => (
      <Calendar
        mode="single"
        selected={fecha}
        onSelect={manejarSeleccionarFecha}
        onDayDoubleClick={manejarDobleClickDia}
        className="rounded-md w-full h-full flex flex-col [&_.rdp-months]:w-full [&_.rdp-months]:flex-1 [&_.rdp-month]:w-full [&_.rdp-month]:flex-1 [&_table]:w-full [&_table]:flex-1 [&_tbody]:flex-1 [&_tbody]:flex [&_tbody]:flex-col [&_tr]:flex-1 [&_tr]:gap-2 [&_td]:flex-1 [&_.rdp-cell]:flex-1 [&_.rdp-button]:w-full [&_.rdp-button]:h-full [&_.rdp-button]:text-base"
      />
    ),
    [fecha, manejarSeleccionarFecha, manejarDobleClickDia]
  );

  // Eventos del día seleccionado (para el diálogo de detalle)
  const eventosDiaSeleccionado = useMemo(() => {
    if (!diaSeleccionado) return [];
    const fechaStr = format(diaSeleccionado, "yyyy-MM-dd");
    return eventos.filter((e) => e.event_date === fechaStr);
  }, [diaSeleccionado, eventos]);

  // Próximos eventos (desde hoy en adelante, hasta 10)
  const eventosProximos = useMemo(() => {
    const hoyStr = format(new Date(), "yyyy-MM-dd");
    return eventos.filter((e) => e.event_date >= hoyStr).slice(0, 10);
  }, [eventos]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full min-w-0">

          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gestiona tus fechas importantes y exámenes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Ajustes de Calendario</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tieneTokenCalendario ? (
                    <DropdownMenuItem disabled className="text-green-500 focus:text-green-500">
                      <Check className="mr-2 h-4 w-4" />
                      Google Calendar conectado
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={manejarConectarGoogle}
                      disabled={conectando}
                    >
                      {conectando ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarIcon className="mr-2 h-4 w-4" />
                      )}
                      <div className="flex flex-col">
                        <span>Conectar Google Calendar</span>
                        <span className="text-xs text-muted-foreground">Sincroniza tus eventos automáticamente</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Añadir Evento */}
              <Dialog open={abiertoAgregarEvento} onOpenChange={establecerAbiertoAgregarEvento}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Añadir Fecha</DialogTitle>
                    <DialogDescription>
                      Rellena los detalles para añadir un evento o examen a tu calendario.
                    </DialogDescription>
                  </DialogHeader>
                  {abiertoAgregarEvento && (
                    <AddEventForm
                      alExito={() => establecerAbiertoAgregarEvento(false)}
                      fechaInicial={fecha}
                      alEnviarEvento={manejarEnviarCrear}
                    />
                  )}
                </DialogContent>
              </Dialog>

              {/* Editar Evento */}
              <Dialog open={abiertoEditar} onOpenChange={establecerAbiertoEditar}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Editar Evento</DialogTitle>
                    <DialogDescription>
                      Modifica los detalles del evento o elimínalo.
                    </DialogDescription>
                  </DialogHeader>
                  {abiertoEditar && eventoEnEdicion && (
                    <AddEventForm
                      alExito={() => { establecerAbiertoEditar(false); establecerEventoEnEdicion(undefined); }}
                      evento={eventoEnEdicion}
                      alEnviarEvento={manejarEnviarEditar}
                      alEliminar={manejarEliminar}
                    />
                  )}
                </DialogContent>
              </Dialog>

              {/* Detalle del Día */}
              <Dialog open={abiertoDetalleDia} onOpenChange={establecerAbiertoDetalleDia}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      Eventos para el{" "}
                      {diaSeleccionado?.toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </DialogTitle>
                    <DialogDescription>
                      Revisa los eventos programados para este día.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    {eventosDiaSeleccionado.length > 0 ? (
                      eventosDiaSeleccionado.map((evento) => (
                        <button
                          key={evento.id}
                          onClick={() => manejarClickEvento(evento)}
                          className="w-full text-left flex flex-col gap-1 border-l-2 border-primary pl-3 py-1 rounded-r-sm hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <span className="text-sm font-medium">{evento.title}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border w-fit ${COLOR_TIPO_EVENTO[evento.type as EventType]}`}
                          >
                            {evento.type}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay eventos programados.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={manejarAgregarEventoDesdeDetalle}>
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Nuevo Evento a este Día
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-12 w-full min-w-0">
            {/* Widget del Calendario */}
            <Card className="bg-card shadow-none md:col-span-8 lg:col-span-8 overflow-hidden flex flex-col p-4 w-full">
              {widgetCalendario}
            </Card>

            {/* Lista de Próximos Eventos */}
            <Card className="bg-card shadow-none md:col-span-4 lg:col-span-4 overflow-y-auto h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {cargando ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventosProximos.map((evento) => (
                      <button
                        key={evento.id}
                        onClick={() => manejarClickEvento(evento)}
                        className="w-full text-left flex flex-col gap-1 border-l-2 border-primary pl-3 py-1 rounded-r-sm hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <span className="text-sm font-medium line-clamp-1 truncate">
                          {evento.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(evento.event_date + "T00:00:00").toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-1.5 h-4 ${COLOR_TIPO_EVENTO[evento.type as EventType]}`}
                          >
                            {evento.type}
                          </Badge>
                        </div>
                      </button>
                    ))}
                    {eventosProximos.length === 0 && (
                      <div className="text-sm text-center text-muted-foreground py-6">
                        No hay eventos próximos.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
