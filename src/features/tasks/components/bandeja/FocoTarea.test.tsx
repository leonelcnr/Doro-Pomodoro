import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { Tarea } from "@/types/dominio"
import { FocoTarea } from "./FocoTarea"

const tarea = { id: 7, header: "Leer el capítulo 3", kind: "tarea", status: "Sin Empezar" } as Tarea

const montar = () => {
    const onEditar = vi.fn()
    render(<FocoTarea foco={tarea} nombreTema="General" onSoltar={vi.fn()} onMarcarHecha={vi.fn()} onCambiarChecklist={vi.fn()} onEditar={onEditar} />)
    return onEditar
}

describe("FocoTarea", () => {
    it("el lápiz y el doble clic en la tarjeta abren el detalle", () => {
        const onEditar = montar()
        fireEvent.click(screen.getByRole("button", { name: "Editar" }))
        fireEvent.doubleClick(screen.getByText("Leer el capítulo 3"))
        expect(onEditar).toHaveBeenCalledTimes(2)
        expect(onEditar).toHaveBeenCalledWith(tarea)
    })

    it("doble clic en un botón de la tarjeta no abre el detalle", () => {
        const onEditar = montar()
        fireEvent.doubleClick(screen.getByRole("button", { name: /Marcar como hecha/ }))
        expect(onEditar).not.toHaveBeenCalled()
    })
})
