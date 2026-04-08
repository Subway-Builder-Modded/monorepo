import { useEffect } from 'react';

export function useNavbarOffset(element: HTMLDivElement | null) {
  useEffect(() => {
    if (!element) return;

    const updateOffset = () => {
      const offset = Math.ceil(element.getBoundingClientRect().height + 24);
      document.documentElement.style.setProperty(
        '--app-navbar-offset',
        `${offset}px`,
      );
    };

    updateOffset();

    const observer = new ResizeObserver(updateOffset);
    observer.observe(element);
    window.addEventListener('resize', updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOffset);
      document.documentElement.style.removeProperty('--app-navbar-offset');
    };
  }, [element]);
}
