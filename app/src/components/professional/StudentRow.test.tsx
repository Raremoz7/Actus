import { render, screen, fireEvent } from '@testing-library/react-native';
import { StudentRow, studentInitials } from './StudentRow';

describe('StudentRow', () => {
  it('mostra nome e subtítulo', () => {
    render(
      <StudentRow name="Maria Silva" subtitle="maria@exemplo.com" onPress={jest.fn()} />,
    );
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('maria@exemplo.com')).toBeTruthy();
  });

  it('dispara onPress ao tocar na linha', () => {
    const onPress = jest.fn();
    render(<StudentRow name="João" subtitle="joao@exemplo.com" onPress={onPress} />);
    fireEvent.press(screen.getByText('João'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('StudentRow · selo Par-Q', () => {
  it('mostra "Atenção" quando parqStatus=attention', () => {
    render(
      <StudentRow
        name="Maria"
        subtitle="maria@x.com"
        parqStatus="attention"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('não mostra selo quando parqStatus=clear', () => {
    render(
      <StudentRow name="Ana" subtitle="ana@x.com" parqStatus="clear" onPress={jest.fn()} />,
    );
    expect(screen.queryByText('Par-Q pendente')).toBeNull();
    expect(screen.queryByText('Atenção')).toBeNull();
  });
});

describe('studentInitials', () => {
  it('usa as iniciais do primeiro e do último nome', () => {
    expect(studentInitials('Maria Silva')).toBe('MS');
  });

  it('usa só a primeira letra quando há um único nome', () => {
    expect(studentInitials('João')).toBe('J');
  });

  it('cai para · quando o nome é vazio', () => {
    expect(studentInitials('   ')).toBe('·');
  });
});
