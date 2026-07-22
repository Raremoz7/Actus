import { render, screen } from '@testing-library/react-native';
import { RankingRow } from './RankingRow';

describe('RankingRow', () => {
  it('mostra posição, nome, streak (métrica do ranking) e dias ativos', () => {
    render(
      <RankingRow position={2} name="Marina" activeDays={18} streak={5} isMe={false} />,
    );
    expect(screen.getByText('Marina')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    // streak é o número em destaque (critério de ordenação do ranking)
    expect(screen.getByText('5')).toBeTruthy();
    // dias ativos como métrica secundária
    expect(screen.getByText('18d ativos')).toBeTruthy();
  });

  it('mostra "Você" quando isMe', () => {
    render(
      <RankingRow position={1} name="Marina" activeDays={20} streak={7} isMe />,
    );
    expect(screen.getByText('Você')).toBeTruthy();
  });

  it('na própria linha mostra recorde e última atividade relativa', () => {
    render(
      <RankingRow
        position={1}
        name="Marina"
        activeDays={20}
        streak={7}
        isMe
        streakBest={8}
        lastActivityDate="2026-06-06"
        today="2026-06-06"
      />,
    );
    expect(screen.getByText('recorde: 8 dias · ativo hoje')).toBeTruthy();
  });

  it('não mostra ícone de chama quando streak é 0', () => {
    render(
      <RankingRow position={5} name="Carlos" activeDays={3} streak={0} isMe={false} />,
    );
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByTestId('streak-flame')).toBeNull();
  });

  it('mostra ícone de chama quando streak é 1 ou mais', () => {
    render(
      <RankingRow position={1} name="Ana" activeDays={10} streak={1} isMe={false} />,
    );
    expect(screen.getByTestId('streak-flame')).toBeTruthy();
  });
});
