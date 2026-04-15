import { useCallback, useEffect, useRef, useState } from "react";

type UseNavbarPanelHeightOptions = {
  isMobile: boolean;
  itemCount: number;
  suiteId: string;
};

export function useNavbarPanelHeight({
  isMobile,
  itemCount,
  suiteId,
}: UseNavbarPanelHeightOptions) {
  const [panelContentHeight, setPanelContentHeight] = useState(0);
  const panelMeasureRef = useRef<HTMLDivElement | null>(null);

  const measurePanelHeight = useCallback(() => {
    const contentElement = panelMeasureRef.current;
    if (!contentElement) {
      return;
    }

    const nextHeight = Math.ceil(contentElement.scrollHeight);
    setPanelContentHeight((previousHeight) =>
      previousHeight === nextHeight ? previousHeight : nextHeight,
    );
  }, []);

  useEffect(() => {
    measurePanelHeight();

    const frameId = window.requestAnimationFrame(measurePanelHeight);
    const contentElement = panelMeasureRef.current;
    if (!contentElement || typeof ResizeObserver === "undefined") {
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new ResizeObserver(() => {
      measurePanelHeight();
    });

    observer.observe(contentElement);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [isMobile, itemCount, measurePanelHeight, suiteId]);

  return {
    panelContentHeight,
    panelMeasureRef,
  };
}
