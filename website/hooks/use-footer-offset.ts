'use client';

import { useState, useEffect } from 'react';

export function useFooterOffset() {
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    function update() {
      const footerRect = footer!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const footerVisibleHeight = Math.max(0, viewportHeight - footerRect.top);
      setBottomOffset(footerVisibleHeight);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return bottomOffset;
}
