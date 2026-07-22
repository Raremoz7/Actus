import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeekdayLineChart } from './charts';

const props = {
  xLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  fullLabels: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
  series: [
    { label: 'Masculino', color: 'var(--color-data-1)', values: [61, 54, 58, 49, 63, 38, 12] },
    { label: 'Feminino', color: 'var(--color-data-4)', values: [72, 66, 69, 58, 55, 47, 18] },
  ],
};

describe('WeekdayLineChart', () => {
  it('renderiza os labels curtos dos dias', () => {
    render(<WeekdayLineChart {...props} />);
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
  });

  it('mostra tooltip com dia, categorias e total ao passar o mouse numa coluna', () => {
    const { container } = render(<WeekdayLineChart {...props} />);
    const cols = container.querySelectorAll('[data-hover-col]');
    expect(cols.length).toBe(7);
    fireEvent.mouseEnter(cols[4]); // Sexta
    expect(screen.getByText('Sexta-feira')).toBeInTheDocument();
    expect(screen.getByText('Masculino')).toBeInTheDocument();
    expect(screen.getByText('Feminino')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument(); // masc sexta
    expect(screen.getByText('55')).toBeInTheDocument(); // fem sexta
    expect(screen.getByText('118')).toBeInTheDocument(); // total
  });

  it('esconde o tooltip ao sair do gráfico', () => {
    const { container } = render(<WeekdayLineChart {...props} />);
    const plot = container.querySelector('[data-plot]')!;
    const cols = container.querySelectorAll('[data-hover-col]');
    fireEvent.mouseEnter(cols[0]);
    expect(screen.getByText('Segunda-feira')).toBeInTheDocument();
    fireEvent.mouseLeave(plot);
    expect(screen.queryByText('Segunda-feira')).not.toBeInTheDocument();
  });
});
