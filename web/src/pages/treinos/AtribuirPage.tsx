import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudents } from '../../hooks/useStudents';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import { useAssignWorkout, type AssignWorkoutPayload } from '../../hooks/useWorkoutMutations';

// weekdays da API: 1=segunda … 7=domingo (backend/api/src/routes/studentWorkouts.ts)
const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'SEG' },
  { value: 2, label: 'TER' },
  { value: 3, label: 'QUA' },
  { value: 4, label: 'QUI' },
  { value: 5, label: 'SEX' },
  { value: 6, label: 'SÁB' },
  { value: 7, label: 'DOM' },
];

export function AtribuirPage() {
  const navigate = useNavigate();
  const { id: workoutId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const workout = useWorkoutDetail(workoutId);
  const studentsQuery = useStudents();
  const assign = useAssignWorkout();

  const [studentId, setStudentId] = useState(searchParams.get('aluno') ?? '');
  const [search, setSearch] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(
      (s) =>
        q === '' ||
        (s.full_name ?? '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    setError(null);
  }

  async function submit() {
    if (!workoutId) return;
    if (studentId === '') {
      setError('Selecione um aluno.');
      return;
    }
    if (weekdays.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('A data final precisa ser depois do início.');
      return;
    }
    setError(null);

    const payload: AssignWorkoutPayload = {
      workout_id: workoutId,
      weekdays: [...weekdays].sort((a, b) => a - b),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    };

    try {
      await assign.mutateAsync({ studentId, payload });
      navigate(`/alunos/${studentId}`);
    } catch (err) {
      const branch =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        'erro inesperado';
      setError(`Não foi possível atribuir (${branch}).`);
    }
  }

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center gap-4 border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Atribuir treino
        </h1>
        {workout.isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : workout.data ? (
          <span className="font-mono text-xs text-text-2">
            {workout.data.name} · {workout.data.exercises.length} exercícios
          </span>
        ) : (
          <span className="text-xs text-error">Treino não encontrado.</span>
        )}
        <Button
          variant="ghost"
          className="ml-auto !px-4 !py-1.5 !text-xs"
          onClick={() => navigate('/treinos')}
        >
          Voltar
        </Button>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-3">Aluno</p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="mb-2 h-8 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
          />
          <div className="max-h-64 overflow-y-auto rounded-xl border border-outline-v">
            {studentsQuery.isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : visibleStudents.length === 0 ? (
              <p className="p-4 text-sm text-text-3">Nenhum aluno encontrado.</p>
            ) : (
              <ul>
                {visibleStudents.map((s) => {
                  const selected = s.id === studentId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentId(s.id);
                          setError(null);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          selected ? 'bg-neon/10' : 'hover:bg-surface-2'
                        }`}
                      >
                        <Avatar name={s.full_name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-text-1">
                            {s.full_name ?? s.email}
                          </span>
                          <span className="block truncate text-xs text-text-3">{s.email}</span>
                        </span>
                        {selected && <span className="font-mono text-xs text-neon">selecionado</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-text-3">
            Dias da semana
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const checked = weekdays.includes(d.value);
              return (
                <label
                  key={d.value}
                  className={`cursor-pointer rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
                    checked
                      ? 'border-neon bg-neon/15 text-neon'
                      : 'border-outline-v text-text-2 hover:border-outline'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWeekday(d.value)}
                    className="sr-only"
                  />
                  {d.label}
                </label>
              );
            })}
          </div>
        </section>

        <section className="flex gap-6">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-3">
              Início (opcional)
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-xl border border-outline-v bg-surface-1 px-3 font-mono text-sm text-text-1 focus:border-neon focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-3">
              Fim (opcional)
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-xl border border-outline-v bg-surface-1 px-3 font-mono text-sm text-text-1 focus:border-neon focus:outline-none"
            />
          </label>
        </section>

        <Card className="flex items-center gap-4">
          <div className="flex-1">
            {error ? (
              <p className="text-sm text-error">{error}</p>
            ) : (
              <p className="text-sm text-text-3">
                O treino entra na agenda do aluno nos dias selecionados.
              </p>
            )}
          </div>
          <Button disabled={assign.isPending || !workout.data} onClick={() => void submit()}>
            {assign.isPending ? 'Atribuindo…' : 'Atribuir treino'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
