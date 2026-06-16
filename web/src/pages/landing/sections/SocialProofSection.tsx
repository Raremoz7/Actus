import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MEMBER_POSTS = [
  {
    user: 'firstdayback',
    handle: '@firstdayback_fitness',
    text: 'First day back in the green in a week.\n\nIt was a stressful week.',
    date: 'Today, August 25',
    img: '/landing/member-01.avif',
  },
  {
    user: 'runnerlife',
    handle: '@brunomaceira2',
    text: 'Running 133.03 today. Best pace of the month!',
    date: 'Today, August 25',
    img: '/landing/member-02.avif',
  },
  {
    user: 'healthyeats',
    handle: '@healthyeating',
    text: 'Meal prepped for the week. Feeling great about my macros.',
    date: 'Today, August 25',
    img: '/landing/member-03.avif',
  },
  {
    user: 'elle_maroti',
    handle: '@elle_maroti',
    text: 'Morning workout done. Recovery score 87 — feeling strong.',
    date: 'Today, August 25',
    img: '/landing/member-04.avif',
  },
  {
    user: 'cyclefit',
    handle: '@cyclefit',
    text: 'Strain 14.2 today. Highest this month! Body is adapting.',
    date: 'Today, August 25',
    img: '/landing/member-05.avif',
  },
  {
    user: 'sleepwell',
    handle: '@sleepwell',
    text: 'Finally got 8h of sleep. HRV up 12 points. Worth it!',
    date: 'Today, August 25',
    img: '/landing/member-06.avif',
  },
];

function PostCard({ post }: { post: typeof MEMBER_POSTS[0] }) {
  return (
    <div
      style={{
        flex: '0 0 220px',
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}
    >
      <img src={post.img} alt={post.user} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#222326', marginBottom: 4 }}>
          {post.user}
        </div>
        <p style={{ fontSize: 13, color: 'rgba(34,35,38,0.7)', lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: 8 }}>
          {post.text}
        </p>
        <div style={{ fontSize: 11, color: 'rgba(34,35,38,0.4)' }}>{post.date}</div>
      </div>
    </div>
  );
}

export function SocialProofSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    gsap.from(logosRef.current!.children, {
      y: 16,
      opacity: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: logosRef.current, start: 'top 85%' },
    });
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
    <section ref={sectionRef} style={{ background: '#fff', paddingTop: 80, paddingBottom: 80, overflow: 'hidden' }}>
      {/* Works with */}
      <div ref={logosRef} style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(34,35,38,0.45)', marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Works with
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          <img src="/landing/logo-apple-watch.svg" alt="Apple Watch" style={{ height: 20, opacity: 0.6 }} />
          <img src="/landing/logo-oura.svg" alt="Oura" style={{ height: 20, opacity: 0.6 }} />
          <img src="/landing/logo-garmin.svg" alt="Garmin" style={{ height: 20, opacity: 0.6 }} />
          <img src="/landing/logo-amazfit.svg" alt="Amazfit" style={{ height: 20, opacity: 0.6 }} />
        </div>
      </div>

      {/* Apple awards */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <img src="/landing/apple-awards.avif" alt="Apple Watch Spotlight & New and Noteworthy" style={{ height: 48, margin: '0 auto' }} />
      </div>

      {/* Members heading */}
      <h2
        ref={headingRef}
        style={{
          textAlign: 'center',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 700,
          color: '#222326',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: 48,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        Join over 1 million members<br />on their health journey
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
