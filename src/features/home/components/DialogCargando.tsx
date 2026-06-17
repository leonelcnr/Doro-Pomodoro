import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

// Estado visual de "cargando" que se muestra mientras se procesa el ingreso a una sala
const DialogCargando = () => {
    return (
        <Empty className="w-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Spinner />
                </EmptyMedia>
                <EmptyTitle>Uniéndose a la sala</EmptyTitle>
                <EmptyDescription>
                    Por favor, espera mientras te unimos a la sala. No recargues la página.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                {/* <Button variant="outline" size="sm">
                    Cancelar
                </Button> */}
            </EmptyContent>
        </Empty>
    )
}

export default DialogCargando
