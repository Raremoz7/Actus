import { fireEvent, render, screen } from '@testing-library/react-native';
import { InviteCard } from './InviteCard';

const baseProps = {
  code: 'ABC123',
  active: true,
  usedCount: 1,
  maxUses: 5,
  expiresAtLabel: 'expira em 7 dias',
  onShare: jest.fn(),
  onCopy: jest.fn(),
  onRevoke: jest.fn(),
  onReactivate: jest.fn(),
};

describe('InviteCard', () => {
  it('mostra o código do convite', () => {
    render(<InviteCard {...baseProps} />);
    expect(screen.getByText('ABC123')).toBeTruthy();
  });

  it('mostra usos e validade', () => {
    render(<InviteCard {...baseProps} />);
    expect(screen.getByText('1 / 5 usos')).toBeTruthy();
    expect(screen.getByText('expira em 7 dias')).toBeTruthy();
  });

  it('dispara onShare ao tocar em Compartilhar', () => {
    const onShare = jest.fn();
    render(<InviteCard {...baseProps} onShare={onShare} />);
    fireEvent.press(screen.getByLabelText('Compartilhar convite'));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('mostra Revogar quando ativo e dispara onRevoke', () => {
    const onRevoke = jest.fn();
    render(<InviteCard {...baseProps} active onRevoke={onRevoke} />);
    fireEvent.press(screen.getByLabelText('Revogar convite'));
    expect(onRevoke).toHaveBeenCalledTimes(1);
  });

  it('não mostra Revogar quando inativo', () => {
    render(<InviteCard {...baseProps} active={false} />);
    expect(screen.queryByLabelText('Revogar convite')).toBeNull();
  });

  it('mostra Reativar quando inativo e dispara onReactivate (TEC-71)', () => {
    const onReactivate = jest.fn();
    render(<InviteCard {...baseProps} active={false} onReactivate={onReactivate} />);
    fireEvent.press(screen.getByLabelText('Reativar convite'));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });

  it('não mostra Reativar quando ativo', () => {
    render(<InviteCard {...baseProps} active />);
    expect(screen.queryByLabelText('Reativar convite')).toBeNull();
  });

  it('singular "uso" quando maxUses é 1', () => {
    render(<InviteCard {...baseProps} usedCount={0} maxUses={1} />);
    expect(screen.getByText('0 / 1 uso')).toBeTruthy();
  });
});
