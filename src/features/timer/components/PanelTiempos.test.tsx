import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TimerSettings } from '@/types/timer';
import { PanelTiempos } from './PanelTiempos';

const configuracion: TimerSettings = { pomodoro: 25, shortBreak: 5, longBreak: 15, autoBreak: false };

function abrir(onCambiar = vi.fn()) {
    render(<PanelTiempos configuracion={configuracion} onCambiar={onCambiar} enLaSala={1} />);
    fireEvent.click(screen.getByLabelText('Tiempos del reloj'));
    return { onCambiar, campo: screen.getByLabelText(/Pomodoro, en minutos/) as HTMLInputElement };
}

describe('PanelTiempos', () => {
    it('confirma lo escrito con Enter, sin mandar los dígitos intermedios', () => {
        const { onCambiar, campo } = abrir();
        fireEvent.focus(campo);
        fireEvent.change(campo, { target: { value: '5' } });
        fireEvent.change(campo, { target: { value: '50' } });
        expect(onCambiar).not.toHaveBeenCalled();
        fireEvent.keyDown(campo, { key: 'Enter' });
        fireEvent.blur(campo);
        expect(onCambiar).toHaveBeenCalledTimes(1);
        expect(onCambiar).toHaveBeenCalledWith({ ...configuracion, pomodoro: 50 });
    });

    it('acota al máximo de la fase y descarta lo que no son números', () => {
        const { onCambiar, campo } = abrir();
        fireEvent.change(campo, { target: { value: '9a99' } });
        fireEvent.blur(campo);
        expect(onCambiar).toHaveBeenCalledWith({ ...configuracion, pomodoro: 180 });
    });

    it('un campo vacío o Escape vuelven al valor de antes', () => {
        const { onCambiar, campo } = abrir();
        fireEvent.change(campo, { target: { value: '' } });
        fireEvent.blur(campo);
        fireEvent.change(campo, { target: { value: '40' } });
        fireEvent.keyDown(campo, { key: 'Escape' });
        expect(onCambiar).not.toHaveBeenCalled();
        expect(campo.value).toBe('25');
    });

    it('el − y el + siguen andando', () => {
        const { onCambiar } = abrir();
        fireEvent.click(screen.getByLabelText('Pomodoro: un minuto más'));
        expect(onCambiar).toHaveBeenCalledWith({ ...configuracion, pomodoro: 26 });
    });
});
