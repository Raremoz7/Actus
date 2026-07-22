import { useMealQueueStore } from './mealQueueStore';

beforeEach(() => {
  useMealQueueStore.setState({ items: {}, hydrated: true });
});

describe('mealQueueStore', () => {
  it('enfileira uma refeição como pending', () => {
    const id = useMealQueueStore.getState().enqueue({
      photoUri: 'file://a.jpg', description: 'ovos', tags: ['Café da manhã'],
      eatenAt: '2026-07-01T09:00:00.000Z',
    });
    const item = useMealQueueStore.getState().items[id];
    expect(item?.status).toBe('pending');
    expect(item?.description).toBe('ovos');
  });

  it('marca erro e remove', () => {
    const id = useMealQueueStore.getState().enqueue({
      photoUri: null, description: 'x', tags: [], eatenAt: '2026-07-01T09:00:00.000Z',
    });
    useMealQueueStore.getState().markError(id);
    expect(useMealQueueStore.getState().items[id]?.status).toBe('error');
    useMealQueueStore.getState().remove(id);
    expect(useMealQueueStore.getState().items[id]).toBeUndefined();
  });
});
