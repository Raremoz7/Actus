import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAddMealComment, useStudentMeals } from '../../hooks/useMeals';
import type { MealLog } from '../../lib/schemas';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MealCard({ meal, studentId }: { meal: MealLog; studentId: string }) {
  const [text, setText] = useState('');
  const addComment = useAddMealComment(studentId);

  function send() {
    const body = text.trim();
    if (body === '') return;
    addComment.mutate({ mealId: meal.id, body }, { onSuccess: () => setText('') });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-3">
        {meal.photo_url ? (
          <img
            src={meal.photo_url}
            alt="Refeição"
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-3">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-3">
            {formatDateTime(meal.eaten_at)}
          </div>
          <p className="mt-1 text-sm text-text-1">{meal.description ?? 'Sem descrição'}</p>
        </div>
      </div>

      {meal.comments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-outline-v pt-2">
          {meal.comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium text-neon">{c.author_name ?? 'Profissional'}</span>{' '}
              <span className="text-text-1">{c.body}</span>
              <span className="ml-2 font-mono text-[10px] text-text-3">
                {formatDateTime(c.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Comentar (o aluno é notificado)"
          className="h-9 flex-1 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
        />
        <Button
          variant="primary"
          className="!px-4 !py-1.5 !text-xs"
          onClick={send}
          disabled={addComment.isPending || text.trim() === ''}
        >
          {addComment.isPending ? '…' : 'Comentar'}
        </Button>
      </div>
    </Card>
  );
}

export function AlimentacaoTab({ studentId }: { studentId: string }) {
  const meals = useStudentMeals(studentId);

  if (meals.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (meals.isError) {
    return (
      <p className="py-8 text-center text-sm text-error">
        Não foi possível carregar as refeições. Tente novamente.
      </p>
    );
  }

  const list = meals.data ?? [];
  if (list.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-3">
        Nenhuma refeição registrada pelo aluno ainda. O registro é feito pelo aluno no app.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((meal) => (
        <MealCard key={meal.id} meal={meal} studentId={studentId} />
      ))}
    </div>
  );
}
