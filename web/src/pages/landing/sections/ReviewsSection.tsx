const REVIEWS = [
  {
    title: 'Great and Useful App',
    author: 'optionz0000',
    date: 'September 1, 2025',
    text: 'This app is incredibly useful for tracking my sleep and workouts! I love how it integrates with my Apple Watch and is incredibly accurate compared to other apps. It really helps me plan my day.',
  },
  {
    title: 'This app is superb.',
    author: 'Amz, Bevel User',
    date: 'June 14, 2025',
    text: "This app is superb. It's not long been released but is very polished. Great interface and the developer have a great mission and aspires to be the best of its kind.",
  },
  {
    title: 'Vitality at mind',
    author: 'Metrica S up, Bevel User',
    date: 'April 30, 2025',
    text: "Vitality at mind is what this app is for. Metrica S up it up. Can you recover? Do you improve over time? Stress over 99: it's all. The best health and wellness app that works with Apple Watch aside that built itself up.",
  },
  {
    title: 'Fantastic App',
    author: 'CVNM, August 12, 2025',
    date: 'August 12, 2025',
    text: "There's so much to do. If you wear it 24 hours a day this is an incredibly valuable app to have. Basically what it is: if you wear an Apple watch you can get a full picture of sleep, recovery, and fitness wrapped in one. Strongly recommended.",
  },
  {
    title: 'Best health tracker',
    author: 'FitnessFan2025',
    date: 'July 20, 2025',
    text: 'Finally found an app that connects all my devices. The insights are clear and actionable. My HRV has improved since I started following the recommendations. 5 stars easily.',
  },
  {
    title: 'Changed my routine',
    author: 'NightOwlRunner',
    date: 'May 5, 2025',
    text: 'The sleep tracking is unbelievably accurate. I used to ignore recovery but now it guides my training. Already a fan after 2 weeks. The biological age feature is eye-opening.',
  },
];

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
  return (
    <div
      style={{
        flex: '0 0 280px',
        background: '#fff',
        borderRadius: 16,
        padding: '20px 20px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ color: '#ff9500', fontSize: 13, marginBottom: 8 }}>★★★★★</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#222326', marginBottom: 8 }}>{review.title}</div>
      <p style={{ fontSize: 13, color: 'rgba(34,35,38,0.65)', lineHeight: 1.5, marginBottom: 12 }}>
        "{review.text}"
      </p>
      <div style={{ fontSize: 11, color: 'rgba(34,35,38,0.4)' }}>
        {review.author} · {review.date}
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const allReviews = [...REVIEWS, ...REVIEWS];

  return (
    <section style={{ background: '#fff', padding: 'clamp(60px, 8vw, 100px) 0', overflow: 'hidden' }}>
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
