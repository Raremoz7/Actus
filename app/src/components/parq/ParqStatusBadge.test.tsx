import { render, screen } from '@testing-library/react-native';
import { ParqStatusBadge } from './ParqStatusBadge';

describe('ParqStatusBadge', () => {
  it('mostra "Atenção" quando attention', () => {
    render(<ParqStatusBadge status="attention" />);
    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('mostra "Par-Q pendente" quando not_started', () => {
    render(<ParqStatusBadge status="not_started" />);
    expect(screen.getByText('Par-Q pendente')).toBeTruthy();
  });

  it('não renderiza nada quando clear', () => {
    const { toJSON } = render(<ParqStatusBadge status="clear" />);
    expect(toJSON()).toBeNull();
  });
});
