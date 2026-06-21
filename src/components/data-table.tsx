import * as React from "react"

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { Trash2, Edit2, Star, X, ArrowUp, ArrowRight, ArrowDown, CheckCircle2, Timer, CircleDashed, ChevronsUpDown, EyeOff, GripVertical } from "lucide-react"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldGroup, Field, FieldLabel, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Helpers de tareas: ciclado/normalización de atributos + iconos compartidos
import {
  siguienteEstado,
  siguientePrioridad,
  normalizarEstado,
  normalizarPrioridad,
  INFO_PRIORIDAD,
  INFO_ESTADO,
} from "@/features/tasks/atributos"
import { SelectorCategoria } from "@/features/tasks/components/SelectorCategoria"
import { ChipPrioridad, ChipEstado } from "@/features/tasks/components/ChipAtributo"
import type { Tarea } from "@/types/dominio"


// Clave de localStorage donde se recuerda el filtro de estado de la tabla
const LS_FILTRO_ESTADO = "doro:tareas:filtro-estado"

// Esquema de validación para cada tarea usando Zod
export const schema = z.object({
  id: z.number(),        // ID único de la tarea
  header: z.string(),    // Título/nombre de la tarea
  type: z.string(),      // Tipo de tarea
  status: z.string(),    // Estado: Completada, En Progreso, Sin Empezar
  limit: z.string().optional(),     // Límite o fecha límite
  favorite: z.boolean().optional(), // Tarea favorita o destacada
  priority: z.string().optional(),
  room_id: z.string().nullable().optional(), // Null si es personal, con ID si es de sala
  user_id: z.string().optional(), // ID del dueño
  order_index: z.number().nullable().optional(), // Índice para ordenamiento
  description: z.string().optional() // Descripción ampliada
})


/**
 * Componente DataTableColumnHeader - Cabecera ordenable para las columnas
 */
function DataTableColumnHeader({
  column,
  title,
}: {
  column: any;
  title: string;
}) {
  if (!column.getCanSort()) {
    return <div className="text-xs font-semibold">{title}</div>
  }

  return (
    <div className="flex items-center space-x-2 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent text-xs font-semibold"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem className="cursor-pointer" onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ascendente
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Descendente
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ocultar columna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/**
 * Definición de columnas de la tabla
 * Cada columna define cómo se muestra y comporta una parte de los datos de la tarea
 */
const getColumns = (
  onDeleteTask: (id: number) => void,
  onToggleFavorite: (id: number) => void,
  onEditTask: (task: z.infer<typeof schema>) => void,
  onDirectUpdateTask: (task: z.infer<typeof schema>) => void,
  // Ruta rápida para "tocar y cambiar" un solo atributo (estado/prioridad/categoría)
  onCycleUpdate: (id: number, datos: Partial<Tarea>) => void,
  categorias: string[],
  onMoveTask?: (id: number) => void // Nueva acción opcional
): ColumnDef<z.infer<typeof schema>>[] => [
    {
      id: "dragHandle",
      header: "",
      cell: () => null, // Placeholder since we render Grip in SortableRow directly
      enableHiding: false,
    },
    // Columna de selección - permite seleccionar múltiples tareas
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        </div>
      ),
      enableHiding: false,
    },
    // Columna de título de la tarea (Badge + Título)
    {
      accessorKey: "header",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
      cell: ({ row, table }) => {
        const isCompleting = (table.options.meta as any)?.completingIds?.has?.(row.original.id);
        const isCompleted = row.original.status === 'Completada' || isCompleting;
        
        return (
          <div className="flex items-center space-x-2">
            {row.original.favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
            {/* Categoría clicable: abre el selector para cambiarla o crear una nueva */}
            <SelectorCategoria
              value={row.original.type}
              categorias={categorias}
              onSeleccionar={(categoria) => onCycleUpdate(row.original.id, { type: categoria })}
            >
              <button type="button" title="Cambiar categoría" className="focus-visible:outline-none">
                <Badge variant="outline" className={`px-2 py-0.5 whitespace-nowrap font-medium text-[11px] text-foreground capitalize border-border bg-transparent cursor-pointer hover:bg-accent transition-opacity duration-500 ${isCompleted ? 'opacity-50' : ''}`}>
                  {row.original.type}
                </Badge>
              </button>
            </SelectorCategoria>
            <span 
              className={`max-w-[500px] truncate font-medium ${isCompleted ? 'text-muted-foreground opacity-70' : ''}`}
              style={{
                  backgroundImage: "linear-gradient(transparent calc(50% - 1px), currentColor calc(50% - 1px), currentColor calc(50% + 1px), transparent calc(50% + 1px))",
                  backgroundSize: isCompleted ? "100% 100%" : "0% 100%",
                  backgroundRepeat: "no-repeat",
                  transition: "background-size 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s ease-out, opacity 0.5s ease-out",
              }}
            >
              <TableCellViewer item={row.original} onUpdate={onDirectUpdateTask} categorias={categorias} />
            </span>
          </div>
        )
      },
      enableHiding: false,
    },
    // Columna de estado - muestra si está completada, en progreso o sin empezar
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      // Tocar el estado lo cicla al siguiente (Sin Empezar → En Progreso → Completada → …)
      cell: ({ row }) => {
        const estado = normalizarEstado(row.original.status)
        const { icono: Icono, clase } = INFO_ESTADO[estado]
        return (
          <button
            type="button"
            title="Cambiar estado"
            onClick={() => onCycleUpdate(row.original.id, { status: siguienteEstado(row.original.status) })}
            className="focus-visible:outline-none"
          >
            <Badge variant="outline" className="text-muted-foreground px-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-accent">
              <Icono className={`h-3.5 w-3.5 ${clase}`} />
              <span>{estado}</span>
            </Badge>
          </button>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.getValue(id))
      },
    },
    // Columna de Prioridad
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridad" />,
      sortingFn: (rowA, rowB, columnId) => {
        const priorityValues: Record<string, number> = { "High": 3, "Alta": 3, "Medium": 2, "Media": 2, "Low": 1, "Baja": 1 };
        const valA = priorityValues[rowA.getValue(columnId) as string] || 2;
        const valB = priorityValues[rowB.getValue(columnId) as string] || 2;
        return valA - valB;
      },
      // Tocar la prioridad la cicla a la siguiente (Alta → Media → Baja → …).
      // Ícono (color del nivel) + palabra, con hover tipo botón (borde + fondo).
      cell: ({ row }) => {
        const prioridad = normalizarPrioridad(row.original.priority)
        const { icono: Icono, clase } = INFO_PRIORIDAD[prioridad]
        return (
          <button
            type="button"
            title="Cambiar prioridad"
            onClick={() => onCycleUpdate(row.original.id, { priority: siguientePrioridad(row.original.priority) })}
            className="inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm transition-colors hover:border-border hover:bg-accent focus-visible:outline-none"
          >
            <Icono className={`h-4 w-4 ${clase}`} />
            <span>{prioridad}</span>
          </button>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.getValue(id))
      },
    },

    // Columna de acciones - menú para editar, copiar o eliminar tareas
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex h-8 w-8 p-0"
              size="icon"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => onEditTask(row.original)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite(row.original.id)}>
              <Star className={`mr-2 h-4 w-4 ${row.original.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {row.original.favorite ? 'Quitar Favorito' : 'Favorito'}
            </DropdownMenuItem>
            {onMoveTask && (
              <DropdownMenuItem onClick={() => onMoveTask(row.original.id)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {row.original.room_id ? 'Hacer Personal' : 'Mover a la Sala'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDeleteTask(row.original.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]


// Componente de fila arrastrable
const SortableRow = ({ row, isSelected }: { row: Row<z.infer<typeof schema>>; isSelected: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 10, position: "relative" as any, backgroundColor: "var(--accent)" } : {}),
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isSelected && "selected"}
      className={`transition-all ${row.original.status === "Completada" ? "opacity-60 bg-muted/30" : ""}`}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          {...(cell.column.id === 'dragHandle' ? { ...attributes, ...listeners, className: "cursor-grab active:cursor-grabbing w-8 px-2 flex items-center justify-center h-[52px]" } : {})}
        >
          {cell.column.id === 'dragHandle' ? <GripVertical className="h-4 w-4 text-muted-foreground" /> : flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

/**
 * Componente principal DataTable - Tabla de gestión de tareas
 * Muestra una tabla interactiva con funcionalidades de ordenamiento, filtrado, paginación y arrastre
 * @param data - Array de tareas a mostrar en la tabla
 */
export function DataTable({
  data: initialData,
  onTasksChange,
  onActualizarTarea,
  onMoveTask,
  slotAltaRapida,
}: {
  data: z.infer<typeof schema>[];
  onTasksChange?: (newData: z.infer<typeof schema>[]) => void;
  // Ruta rápida de edición de un atributo (un solo registro), sin reconstruir el array
  onActualizarTarea?: (id: number, datos: Partial<Tarea>) => void;
  onMoveTask?: (id: number) => void;
  // Contenido opcional (p. ej. la fila de alta rápida) entre la barra de filtros y la tabla
  slotAltaRapida?: React.ReactNode;
}) {
  // Estados para manejar los datos y el comportamiento de la tabla
  const [data, setData] = React.useState(() => initialData) // Datos de las tareas

  // Actualizar el estado interno si las props cambian (útil para realtime de Supabase)
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);
  const [rowSelection, setRowSelection] = React.useState({}) // Filas seleccionadas
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({}) // Visibilidad de columnas
  // Filtro de estado: por defecto se muestran TODAS (incluidas las completadas);
  // la preferencia del usuario se recuerda en localStorage.
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => {
    try {
      const guardado = localStorage.getItem(LS_FILTRO_ESTADO)
      if (guardado) {
        const valores = JSON.parse(guardado)
        if (Array.isArray(valores) && valores.length) return [{ id: "status", value: valores }]
      }
    } catch { /* localStorage no disponible: usamos el default */ }
    return [] // por defecto: sin filtro (se ven todas, incluidas las completadas)
  })

  // Persiste el filtro de estado (o lo borra si no hay selección) ante cada cambio
  React.useEffect(() => {
    try {
      const filtroEstado = columnFilters.find((f) => f.id === "status")
      const valores = filtroEstado?.value
      if (Array.isArray(valores) && valores.length) {
        localStorage.setItem(LS_FILTRO_ESTADO, JSON.stringify(valores))
      } else {
        localStorage.removeItem(LS_FILTRO_ESTADO)
      }
    } catch { /* localStorage no disponible: ignoramos */ }
  }, [columnFilters])
  const [sorting, setSorting] = React.useState<SortingState>([]) // Ordenamiento de columnas
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  }) // Configuración de paginación

  const [completingIds, setCompletingIds] = React.useState<Set<number>>(new Set());

  // Add Task dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newTask, setNewTask] = React.useState<Partial<z.infer<typeof schema>>>({
    header: "",
    status: "Sin Empezar",
    priority: "Medium",
    type: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      let currentData = [...data];

      if (sorting.length > 0) {
        // Use the current sorted visual order as the base for the new manual order
        const sortedRows = table.getSortedRowModel().rows.map(r => r.original);
        const sortedIds = new Set(sortedRows.map(r => r.id));
        const unsortedRows = currentData.filter(r => !sortedIds.has(r.id));

        currentData = [...sortedRows, ...unsortedRows];
        setSorting([]); // Clear sorting mode since user took manual control
      }

      const oldIndex = currentData.findIndex((item) => item.id.toString() === active.id)
      const newIndex = currentData.findIndex((item) => item.id.toString() === over.id)

      const reordered = arrayMove(currentData, oldIndex, newIndex)
      const updated = reordered.map((item, idx) => ({ ...item, order_index: idx }))
      setData(updated)

      // We shouldn't block the UI while Supabase updates, so use a timeout
      setTimeout(() => onTasksChange?.(updated), 0)
    }
  }


  const handleDeleteTask = (id: number) => {
    const newData = data.filter((task) => task.id !== id);
    setData(newData);
    onTasksChange?.(newData);
  }

  const handleToggleFavorite = (id: number) => {
    const newData = data.map((task) =>
      task.id === id ? { ...task, favorite: !task.favorite } : task
    );
    setData(newData);
    onTasksChange?.(newData);
  }

  const handleEditTask = (task: z.infer<typeof schema>) => {
    setNewTask(task)
    setIsDialogOpen(true)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()

    let newData = [...data];
    const sanitizedHeader = newTask.header?.trim().substring(0, 100) || "Nueva Tarea";
    const sanitizedType = newTask.type?.trim().substring(0, 50) || "General";

    if (newTask.id) {
      // Edit existing
      newData = data.map(t => t.id === newTask.id ? { ...t, ...newTask, header: sanitizedHeader, type: sanitizedType } as z.infer<typeof schema> : t);
    } else {
      // Add new: Siempre generamos un ID temporal súper alto para que RoomPage lo detecte como INSERT
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const newTaskEntry: z.infer<typeof schema> = {
        id: newId,
        header: sanitizedHeader,
        type: sanitizedType,
        status: newTask.status || "Sin Empezar",
        limit: "N/A",
        favorite: newTask.favorite || false,
        priority: newTask.priority || "Medium",
        room_id: newTask.room_id || null, // Se puede heredar al crear
      }
      newData = [...data, newTaskEntry];
    }
    setData(newData);
    onTasksChange?.(newData);

    setIsDialogOpen(false) // Close dialog
    // Reset form
    setNewTask({
      header: "",
      status: "Sin Empezar",
      priority: "Medium",
      type: "",
    })
  }

  const handleDirectUpdateTask = (updatedTask: z.infer<typeof schema>) => {
    const newData = data.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    );
    setData(newData);
    onTasksChange?.(newData);
  };

  // Edición rápida de un atributo (tocar para ciclar / elegir categoría): refleja el
  // cambio localmente al instante y lo persiste por la ruta de un solo registro.
  // Sin `onActualizarTarea` cae al guardado por array completo, para no perder el cambio.
  const handleQuickUpdate = React.useCallback((id: number, datos: Partial<Tarea>) => {
    setData((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...datos } : t));
      if (!onActualizarTarea) onTasksChange?.(next);
      return next;
    });
    onActualizarTarea?.(id, datos);
  }, [onActualizarTarea, onTasksChange]);

  // Categorías presentes en las tareas actuales (alimentan el selector de las filas)
  const categorias = React.useMemo(
    () => Array.from(new Set(data.map((t) => t.type).filter((t): t is string => !!t && t.trim().length > 0))),
    [data]
  );

  // Derive columns here to pass the delete function
  const columns = React.useMemo(() => getColumns(handleDeleteTask, handleToggleFavorite, handleEditTask, handleDirectUpdateTask, handleQuickUpdate, categorias, onMoveTask), [data, onMoveTask, handleQuickUpdate, categorias])


  // Configuración de la tabla usando React Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true, // Permite seleccionar filas
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      completingIds
    }
  })

  const handleDeleteSelected = () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
    const newData = data.filter((task) => !selectedIds.includes(task.id))
    setData(newData)
    onTasksChange?.(newData)
    table.resetRowSelection()
  }

  const handleCompleteSelected = () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
    
    // Activa el estado de animación
    setCompletingIds(prev => new Set([...prev, ...selectedIds]))
    
    // Espera a que termine la animación antes de propagar el cambio
    setTimeout(() => {
        const newData = data.map((task) =>
          selectedIds.includes(task.id) ? { ...task, status: "Completada" } : task
        )
        setData(newData)
        onTasksChange?.(newData)
        table.resetRowSelection()
        setCompletingIds(new Set())
    }, 500)
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar tareas..."
            value={(table.getColumn("header")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("header")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <IconPlus className="mr-2 h-4 w-4" />
                Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[150px]">
              {["Completada", "En Progreso", "Sin Empezar"].map((status) => {
                const isSelected = (table.getColumn("status")?.getFilterValue() as string[])?.includes(status)
                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const current = (table.getColumn("status")?.getFilterValue() as string[]) || []
                      const next = checked ? [...current, status] : current.filter((v) => v !== status)
                      table.getColumn("status")?.setFilterValue(next.length ? next : undefined)
                    }}
                  >
                    <div className="flex items-center">
                      {status === "Completada" && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />}
                      {status === "En Progreso" && <Timer className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />}
                      {status === "Sin Empezar" && <CircleDashed className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span>{status}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
              {((table.getColumn("status")?.getFilterValue() as string[])?.length ?? 0) > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue(undefined)} className="justify-center text-center">
                    Limpiar filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <IconPlus className="mr-2 h-4 w-4" />
                Prioridad
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[150px]">
              {[
                { value: "High", label: "Alta" },
                { value: "Medium", label: "Media" },
                { value: "Low", label: "Baja" }
              ].map((priority) => {
                const isSelected = (table.getColumn("priority")?.getFilterValue() as string[])?.includes(priority.value)
                return (
                  <DropdownMenuCheckboxItem
                    key={priority.value}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const current = (table.getColumn("priority")?.getFilterValue() as string[]) || []
                      const next = checked ? [...current, priority.value] : current.filter((v) => v !== priority.value)
                      table.getColumn("priority")?.setFilterValue(next.length ? next : undefined)
                    }}
                  >
                    {priority.label}
                  </DropdownMenuCheckboxItem>
                )
              })}
              {((table.getColumn("priority")?.getFilterValue() as string[])?.length ?? 0) > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => table.getColumn("priority")?.setFilterValue(undefined)} className="justify-center text-center">
                    Limpiar filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(table.getColumn("header")?.getFilterValue() as string) && (
            <Button
              variant="ghost"
              onClick={() => table.getColumn("header")?.setFilterValue("")}
              className="h-8 px-2 lg:px-3"
            >
              Limpiar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-green-600 border-green-600/20 hover:bg-green-600/10 hover:text-green-700 dark:text-green-500 dark:border-green-500/20 dark:hover:bg-green-500/10 dark:hover:text-green-400"
                onClick={handleCompleteSelected}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Borrar
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto hidden h-8 lg:flex"
              >
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Ver
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Referencia al atajo para abrir el modal global de nueva tarea
              (reemplaza al botón "Agregar Tarea": el alta se hace con T, ⌘K o la fila inline) */}
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">T</kbd>
            nueva tarea
          </span>
          {/* Este Dialog queda solo para EDITAR una tarea desde el menú de acciones */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Tarea</DialogTitle>
                <DialogDescription>
                  Modifica los campos de la tarea. Haz clic en guardar cuando termines.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTask}>
                <FieldGroup className="gap-5 py-4">
                  <Field>
                    <FieldLabel>Nombre de la Tarea</FieldLabel>
                    <FieldContent>
                      <Input
                        id="name"
                        placeholder="Ej. Actualizar diseño..."
                        value={newTask.header}
                        onChange={(e) => setNewTask(prev => ({ ...prev, header: e.target.value }))}
                        maxLength={100}
                        required
                      />
                    </FieldContent>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Estado</FieldLabel>
                      <FieldContent>
                        <Select
                          value={newTask.status}
                          onValueChange={(val) => setNewTask(prev => ({ ...prev, status: val }))}
                        >
                          <SelectTrigger id="status-new-task">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completada">Completada</SelectItem>
                            <SelectItem value="En Progreso">En Progreso</SelectItem>
                            <SelectItem value="Sin Empezar">Sin Empezar</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>Prioridad</FieldLabel>
                      <FieldContent>
                        <Select
                          value={newTask.priority}
                          onValueChange={(val) => setNewTask(prev => ({ ...prev, priority: val }))}
                        >
                          <SelectTrigger id="priority-new-task">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">Alta</SelectItem>
                            <SelectItem value="Medium">Media</SelectItem>
                            <SelectItem value="Low">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <FieldContent>
                      <Input
                        id="type-new-task"
                        placeholder="Ej. Diseño..."
                        value={newTask.type}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, type: e.target.value }))}
                        maxLength={50}
                        required
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Alta rápida: va debajo de la barra de filtros y pegada a la tabla */}
      {slotAltaRapida}
      <div className="overflow-hidden rounded-lg border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={table.getRowModel().rows.map(r => r.original.id.toString())} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.id} row={row} isSelected={row.getIsSelected()} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No hay resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="flex w-full flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Filas por página
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la primera página</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la página anterior</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la página siguiente</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la última página</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div >
  )
}

/**
 * Componente TableCellViewer - Visor detallado de una tarea
 * Muestra un drawer (cajón lateral) con información detallada de la tarea
 * @param item - Datos de la tarea a mostrar
 */
function TableCellViewer({ item, onUpdate, categorias }: { item: z.infer<typeof schema>, onUpdate: (updated: z.infer<typeof schema>) => void, categorias: string[] }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState(item)

  // Sincronizar el local state si cambian los props desde fuera
  React.useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleSave = () => {
    onUpdate(formData)
    setOpen(false)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1 border-b pb-4 mb-4">
          <DrawerTitle className="text-xl">{item.header}</DrawerTitle>
          <DrawerDescription>
            Edita las propiedades de tu tarea o agrega una descripción más ampliada.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-10 text-sm">
          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`header-${item.id}`}>Título de la Tarea</Label>
              <Input id={`header-${item.id}`} value={formData.header} onChange={(e) => setFormData({...formData, header: e.target.value})} />
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor={`desc-${item.id}`}>Descripción</Label>
              <textarea 
                 id={`desc-${item.id}`}
                 className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y" 
                 placeholder="Añade más detalles sobre esta tarea..."
                 value={formData.description || ""}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Atributos editables con los mismos controles del alta (chips + selector) */}
            <div className="flex flex-col gap-3">
              <Label>Atributos</Label>
              <div className="flex flex-wrap items-center gap-2">
                <ChipPrioridad
                  valor={formData.priority}
                  onClick={() => setFormData({ ...formData, priority: siguientePrioridad(formData.priority) })}
                />
                <ChipEstado
                  valor={formData.status}
                  onClick={() => setFormData({ ...formData, status: siguienteEstado(formData.status) })}
                />
                <SelectorCategoria
                  value={formData.type}
                  categorias={categorias}
                  onSeleccionar={(cat) => setFormData({ ...formData, type: cat })}
                />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button onClick={handleSave} className="w-full">Guardar</Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
