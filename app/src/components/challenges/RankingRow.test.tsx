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
});
