import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { claseControl } from '../clasesReloj';

/**
 * Compartir la sala: un toque copia el link de invitación (el código va adentro y
 * pegar el link en el home también sirve), sin diálogo de por medio.
 */
export function CompartirSala({ enlace }: { enlace: string }) {
    const [copiado, establecerCopiado] = useState(false);

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(enlace);
            establecerCopiado(true);
            toast.success('Link copiado. Pasalo y entran directo a la sala.');
            setTimeout(() => establecerCopiado(false), 2000);
        } catch (error: unknown) {
            console.error('No se pudo copiar el link:', error);
            toast.error(`No se pudo copiar. El link es ${enlace}`);
        }
    };

    return (
        <button type="button" onClick={copiar} disabled={!enlace} className={claseControl} title="Copiar el link de la sala" aria-label="Copiar el link de la sala">
            {copiado ? <Check className="animate-in zoom-in-50 duration-200" /> : <Share2 />}
        </button>
    );
}
