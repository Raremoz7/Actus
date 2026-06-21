import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { c, hex, fontBody, fontDisplay, fontMono } from '../theme';

gsap.registerPlugin(ScrollTrigger);

const MEMBER_POSTS = [
  {
    user: 'João Personal',
    handle: 'Personal trainer',
    text: 'Montei a ficha da semana toda dos meus alunos em minutos. O Actus organizou tudo pra mim.',
    date: 'Hoje, 17 de junho',
    img: '/landing/gym/gym-03.jpg',
  },
  {
    user: 'Beatriz Aluna',
    handle: 'Aluna',
    text: 'Recebi o treino direto no app e bati recorde no agachamento. Progresso registrado série a série!',
    date: 'Hoje, 17 de junho',
    img: '/landing/gym/gym-06.jpg',
  },
  {
    user: 'Carla Coach',
    handle: 'Personal trainer',
    text: 'Acompanho o check-in de cada aluno em tempo real e ajusto a carga sem precisar trocar mil mensagens.',
    date: 'Ontem, 16 de junho',
    img: '/landing/gym/gym-08.jpg',
  },
  {
    user: 'Carlos Aluno',
    handle: 'Aluno',
    text: 'A execução de cada exercício vem explicada no app. Treino com técnica e muito mais segurança.',
    date: 'Ontem, 16 de junho',
    img: '/landing/gym/gym-10.jpg',
  },
  {
    user: 'Rafa Treinador',
    handle: 'Personal trainer',
    text: 'O painel mostra a aderência e os inativos na hora. Consigo cuidar de mais alunos com a mesma atenção.',
    date: '2 dias atrás',
    img: '/landing/gym/gym-13.jpg',
  },
  {
    user: 'Marina Aluna',
    handle: 'Aluna',
    text: 'Histórico de cargas e evolução num lugar só. Dá pra ver o quanto eu progredi mês a mês.',
    date: '3 dias atrás',
    img: '/landing/gym/gym-16.jpg',
  },
];

function PostCard({ post }: { post: typeof MEMBER_POSTS[0] }) {
  return (
    <div
      style={{
        flex: '0 0 220px',
        background: hex.surface1,
        border: `1px solid ${c.outlineV}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      <img src={post.img} alt={post.user} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: fontDisplay, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: 14, color: c.text1, marginBottom: 4 }}>
          {post.user}
        </div>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: c.text2, lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: 8 }}>
          {post.text}
        </p>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: c.text3 }}>{post.date}</div>
      </div>
    </div>
  );
}

export function SocialProofSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    gsap.from(headingRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: headingRef.current, start: 'top 85%' },
    });
  }, { scope: sectionRef });

  const allPosts = [...MEMBER_POSTS, ...MEMBER_POSTS];

  return (
    <section ref={sectionRef} style={{ background: hex.bgBase, paddingTop: 80, paddingBottom: 80, overflow: 'hidden' }}>

      {/* Members heading */}
      <h2
        ref={headingRef}
        style={{
          textAlign: 'center',
          fontFamily: fontDisplay,
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: c.text1,
          letterSpacing: '0.01em',
          lineHeight: 1.05,
          marginBottom: 48,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        Junte-se a milhares de alunos<br />treinando com <span style={{ color: c.neon }}>resultado</span>
      </h2>

      {/* Carousel */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .landing-marquee {
            display: flex;
            gap: 16px;
            animation: marquee 35s linear infinite;
            width: max-content;
          }
          .landing-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="landing-marquee" style={{ padding: '8px 8px 16px' }}>
          {allPosts.map((post, i) => (
            <PostCard key={i} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
