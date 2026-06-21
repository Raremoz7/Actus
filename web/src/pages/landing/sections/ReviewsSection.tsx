import { c, hex, fontBody, fontDisplay } from '../theme';

const REVIEWS = [
  {
    title: 'App incrível e prático',
    author: 'carol.personal',
    date: '1 de setembro de 2025',
    text: 'Organizou completamente a minha rotina como personal. Monto os treinos dos meus alunos em minutos e acompanho os check-ins de cada um sem perder nada. Mudou a forma como trabalho.',
  },
  {
    title: 'Simplesmente excelente',
    author: 'Amanda, aluna Actus',
    date: '14 de junho de 2025',
    text: 'Recebo meus treinos direto no celular, com vídeo de cada exercício. A interface é linda e fácil de usar. Meu personal consegue ajustar a ficha na hora quando preciso.',
  },
  {
    title: 'Acompanhamento de perto',
    author: 'Rafael, personal trainer',
    date: '30 de abril de 2025',
    text: 'O que faz diferença é o acompanhamento. Vejo os check-ins e a atividade recente de cada aluno direto no painel. Ficou muito mais fácil ajustar a ficha e manter a galera no ritmo.',
  },
  {
    title: 'App fantástico',
    author: 'Bruno, aluno Actus',
    date: '12 de agosto de 2025',
    text: 'Tem tudo num lugar só: ficha de treino e o catálogo com vídeo de cada exercício. Se você treina sério, é uma ferramenta valiosíssima. Recomendo demais.',
  },
  {
    title: 'O melhor pra montar treino',
    author: 'FitPro2025',
    date: '20 de julho de 2025',
    text: 'Finalmente um app que reúne todos os meus alunos num painel só. As informações são claras e diretas. Economizo horas toda semana montando e ajustando os treinos. 5 estrelas, fácil.',
  },
  {
    title: 'Mudou minha rotina',
    author: 'CorridaNoturna',
    date: '5 de maio de 2025',
    text: 'Reúno todos os meus alunos num painel só e monto os treinos no builder em minutos. O catálogo de exercícios com vídeo ajuda demais. Virei fã em duas semanas.',
  },
];

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
  return (
    <div
      style={{
        flex: '0 0 280px',
        background: hex.surface1,
        border: `1px solid ${c.outlineV}`,
        borderRadius: 16,
        padding: '20px 20px 24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ color: c.neon, fontSize: 13, marginBottom: 8 }}>★★★★★</div>
      <div style={{ fontFamily: fontDisplay, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.01em', fontSize: 14, color: c.text1, marginBottom: 8 }}>{review.title}</div>
      <p style={{ fontFamily: fontBody, fontSize: 13, color: c.text2, lineHeight: 1.5, marginBottom: 12 }}>
        "{review.text}"
      </p>
      <div style={{ fontFamily: fontBody, fontSize: 11, color: c.text3 }}>
        {review.author} · {review.date}
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const allReviews = [...REVIEWS, ...REVIEWS];

  return (
    <section style={{ background: hex.bgLowest, padding: 'clamp(60px, 8vw, 100px) 0', overflow: 'hidden' }}>
      <style>{`
        @keyframes marquee-reviews {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .reviews-marquee {
          display: flex;
          gap: 16px;
          animation: marquee-reviews 40s linear infinite;
          width: max-content;
        }
        .reviews-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="reviews-marquee" style={{ padding: '8px 16px 16px' }}>
        {allReviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>
    </section>
  );
}
