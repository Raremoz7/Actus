export type Greeting = 'Bom dia' | 'Boa tarde' | 'Boa noite';

// Saudação pela hora LOCAL do aparelho (0..23). <12 manhã, 12..17 tarde, >=18 noite.
export function greetingForHour(hour: number): Greeting {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
