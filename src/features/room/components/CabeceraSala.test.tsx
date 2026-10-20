import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import type { UsuarioEnSala } from "@/types/dominio"
import { CabeceraSala } from "./CabeceraSala"

const yo: UsuarioEnSala = { id: "yo", name: "Leo" }
const usuarios: UsuarioEnSala[] = [yo, { id: "otra", name: "Ana" }, { id: "otro", name: "Bruno" }]

function renderizar(usuariosEnSala: UsuarioEnSala[]) {
    render(
        <MemoryRouter>
            <CabeceraSala usuariosEnSala={usuariosEnSala} idPropio="yo" cuenta={<button>Tu cuenta</button>} />
        </MemoryRouter>,
    )
}

describe("CabeceraSala", () => {
    it("saca tu avatar de la pila y pone el menú de la cuenta al final", () => {
        renderizar(usuarios)
        expect(screen.getByLabelText("También en la sala: Ana, Bruno")).toBeInTheDocument()
        expect(screen.queryByTitle("Leo")).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Tu cuenta" })).toBeInTheDocument()
        expect(screen.getByText("3 en la sala")).toBeInTheDocument()
    })

    it("solo en la sala: queda el menú, sin pila", () => {
        renderizar([yo])
        expect(screen.queryByLabelText(/También en la sala/)).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Tu cuenta" })).toBeInTheDocument()
    })
})
