import { render, screen } from '@testing-library/react-native';
import { ParqAttentionBanner } from './ParqAttentionBanner';

describe('ParqAttentionBanner', () => {
  it('renderiza o aviso de atenção', () => {
    render(<ParqAttentionBanner />);
    expect(screen.getByText(/avaliação médica/i)).toBeTruthy();
  });
});
