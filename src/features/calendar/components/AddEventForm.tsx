import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Trash2 } from "lucide-react"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMemo } from "react"
import type { CalendarEvent, EventType } from "../calendarService"

// Esquema de validación del formulario (zod). Las claves (title, date, type,
// description) son los nombres de campo de react-hook-form, por eso se mantienen.
const formSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  date: z.date(),
  type: z.enum(["Examen", "Entrega", "Estudio", "Otro"]),
  description: z.string().optional(),
})

interface PropsAddEventForm {
  alExito?: () => void;
  /** Si se provee, el formulario entra en modo edición */
  evento?: CalendarEvent;
  fechaInicial?: Date;
  alEnviarEvento: (
    valores: { title: string; date: Date; type: EventType; description?: string },
    id?: string
  ) => Promise<void>;
  alEliminar?: (id: string) => Promise<void>;
}

/**
 * Formulario para crear o editar un evento del calendario. Funciona en modo
 * alta o edición según reciba (o no) un `evento`. Delega el guardado y el
 * borrado en los callbacks que recibe por props (la lógica vive en el hook).
 */
export function AddEventForm({
  alExito,
  evento,
  fechaInicial,
  alEnviarEvento,
  alEliminar,
}: PropsAddEventForm) {
  const esEdicion = !!evento;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: evento?.title ?? "",
      type: (evento?.type as EventType) ?? "Examen",
      date: evento ? new Date(evento.event_date + "T00:00:00") : fechaInicial,
      description: evento?.description ?? "",
    },
  })

  // Fecha de hoy a las 00:00, para deshabilitar la selección de fechas pasadas
  const inicioDeHoy = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  }, [])

  async function manejarEnvio(valores: z.infer<typeof formSchema>) {
    // Cerramos el diálogo de inmediato — el trabajo en segundo plano avisa por toast
    form.reset();
    alExito?.();
    // Disparar y olvidar: el hook maneja la actualización optimista y el rollback ante error
    alEnviarEvento(valores, evento?.id);
  }

  async function manejarEliminar() {
    if (evento && alEliminar) {
      // Cerramos el diálogo de inmediato — el hook maneja la baja optimista + rollback
      alExito?.();
      alEliminar(evento.id);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(manejarEnvio)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Examen final de algoritmos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Examen">Examen</SelectItem>
                  <SelectItem value="Entrega">Entrega</SelectItem>
                  <SelectItem value="Estudio">Sesión de Estudio</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < inicioDeHoy}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                El evento aparecerá en tu calendario.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
              <FormControl>
                <Input placeholder="Notas adicionales..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={cn("flex gap-2", esEdicion ? "flex-row justify-between" : "flex-col")}>
          {esEdicion && alEliminar && (
            <Button
              type="button"
              variant="destructive"
              onClick={manejarEliminar}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
          <Button type="submit" className={cn(!esEdicion && "w-full")}>
            {esEdicion ? "Guardar Cambios" : "Guardar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
