import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitFilter } from './UnitFilter';

const units = [
  { id: 'u1', name: 'Unidade Centro' },
  { id: 'u2', name: 'Unidade Zona Sul' },
];

describe('UnitFilter', () => {
  it('lista "Todas as unidades" + as unidades ao abrir', () => {
    render(<UnitFilter units={units} value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /todas as unidades/i }));
    expect(screen.getByText('Unidade Centro')).toBeInTheDocument();
    expect(screen.getByText('Unidade Zona Sul')).toBeInTheDocument();
  });

  it('dispara onChange com o id ao selecionar uma unidade', () => {
    const onChange = vi.fn();
    render(<UnitFilter units={units} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /todas as unidades/i }));
    fireEvent.click(screen.getByText('Unidade Zona Sul'));
    expect(onChange).toHaveBeenCalledWith('u2');
  });

  it('dispara onChange com null ao escolher "Todas"', () => {
    const onChange = vi.fn();
    render(<UnitFilter units={units} value="u1" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/todas as unidades/i));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
