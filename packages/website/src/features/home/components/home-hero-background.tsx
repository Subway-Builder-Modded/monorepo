'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'motion/react';

type HomeHeroBackgroundProps = {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  overlayClassName?: string;
};

export function HomeHeroBackground({
  lightSrc,
  darkSrc,
  alt,
  overlayClassName = 'bg-white/14 dark:bg-black/30',
}: HomeHeroBackgroundProps) {
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [-240, 0, 900], [1, 1, 1.32]);
  const heroY = useTransform(scrollY, [-240, 0, 900], [0, 0, -140]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{ scale: heroScale, y: heroY }}
      >
        <Image
          src={lightSrc}
          alt={alt}
          fill
          priority
          className="object-cover brightness-[1.12] blur-[6px] dark:hidden"
        />
        <Image
          src={darkSrc}
          alt={alt}
          fill
          priority
          className="hidden object-cover brightness-[0.72] blur-[6px] dark:block"
        />
      </motion.div>
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}
