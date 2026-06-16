import Lenis from 'lenis';
import { gsap } from 'gsap';
import { useEffect } from 'react';

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis();

    function rafCallback(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafCallback);
      lenis.destroy();
    };
  }, []);
}
