import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecentStudents } from './RecentStudents';
import type { Student } from '@/types/professional';

const students: Student[] = [
  {
    id: 'a',
    email: 'ana@x.com',
    full_name: 'Ana',
    birth_date: null,
    professional_role: 'personal',
    linked_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'b',
    email: 'bruno@x.com',
    full_name: 'Bruno',
    birth_date: null,
    professional_role: 'personal',
    linked_at: '2026-06-05T00:00:00Z',
  },
];

describe('RecentStudents', () => {
  it('renderiza os alunos e dispara onOpen com o id', () => {
    const onOpen = jest.fn();
    render(<RecentStudents students={students} onOpen={onOpen} />);
    expect(screen.getByText('Ana')).toBeTruthy();
    fireEvent.press(screen.getByText('Bruno'));
    expect(onOpen).toHaveBeenCalledWith('b');
  });

  it('mostra estado vazio quando não há alunos', () => {
    render(<RecentStudents students={[]} onOpen={jest.fn()} />);
    expect(screen.getByText('Nenhum aluno ainda.')).toBeTruthy();
  });
});
