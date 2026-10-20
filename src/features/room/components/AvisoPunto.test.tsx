import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { AvisoPunto } from "./AvisoPunto"

const punto = () => document.querySelector(".aviso-punto")

describe("AvisoPunto", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it("nace, se abre, se cierra, cae y avisa que terminó", () => {
        const alTerminar = vi.fn()
        render(<AvisoPunto aviso={{ id: 1, texto: <>Tarea creada en <b>Física</b></> }} alTerminar={alTerminar} />)

        expect(screen.getByRole("status")).toHaveTextContent("Tarea creada en Física")
        expect(punto()).toHaveAttribute("data-estado", "nace")
        act(() => vi.advanceTimersByTime(380))
        expect(punto()).toHaveAttribute("data-estado", "abierta")
        act(() => vi.advanceTimersByTime(2270))
        expect(punto()).toHaveAttribute("data-estado", "cerrada")
        act(() => vi.advanceTimersByTime(550))
        expect(punto()).toHaveAttribute("data-estado", "sale")
        expect(alTerminar).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(400))
        expect(alTerminar).toHaveBeenCalledWith(1)
    })

    it("un aviso nuevo empieza de cero y el anterior ya no avisa", () => {
        const alTerminar = vi.fn()
        const { rerender } = render(<AvisoPunto aviso={{ id: 1, texto: "Uno" }} alTerminar={alTerminar} />)
        act(() => vi.advanceTimersByTime(2000))
        rerender(<AvisoPunto aviso={{ id: 2, texto: "No se pudo crear", falla: true }} alTerminar={alTerminar} />)

        expect(punto()).toHaveAttribute("data-estado", "nace")
        expect(punto()).toHaveAttribute("data-falla")
        act(() => vi.advanceTimersByTime(3600))
        expect(alTerminar).toHaveBeenCalledTimes(1)
        expect(alTerminar).toHaveBeenCalledWith(2)
    })

    it("sin aviso no muestra nada", () => {
        render(<AvisoPunto aviso={null} alTerminar={vi.fn()} />)
        expect(punto()).toBeNull()
    })
})
