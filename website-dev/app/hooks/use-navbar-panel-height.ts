import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseNavbarPanelHeightOptions = {
  enabled?: boolean;
  isMobile: boolean;
  itemCount: number;
  suiteId: string;
};

export function useNavbarPanelHeight({
  enabled = true,
  isMobile,
  itemCount,
  suiteId,
}: UseNavbarPanelHeightOptions) {
  const [measuredPanelHeight, setMeasuredPanelHeight] = useState(0);
  const [measuredPanelKey, setMeasuredPanelKey] = useState<string | null>(null);
  const [stableSampleCount, setStableSampleCount] = useState(0);
  const panelMeasureRef = useRef<HTMLDivElement | null>(null);
  const lastMeasuredHeightRef = useRef<number | null>(null);
  const panelMeasurementKey = useMemo(
    () => `${suiteId}:${itemCount}:${isMobile ? "mobile" : "desktop"}`,
    [isMobile, itemCount, suiteId],
  );

  const measurePanelHeight = useCallback(() => {
    const contentElement = panelMeasureRef.current;
    if (!contentElement) {
      return;
    }

    const nextHeight = Math.ceil(contentElement.scrollHeight);
    setMeasuredPanelHeight((previousHeight) =>
      previousHeight === nextHeight ? previousHeight : nextHeight,
    );

    setStableSampleCount((previousCount) => {
      if (lastMeasuredHeightRef.current !== nextHeight) {
        lastMeasuredHeightRef.current = nextHeight;
        return 1;
      }

      return previousCount >= 2 ? previousCount : previousCount + 1;
    });

    setMeasuredPanelKey((previousKey) =>
      previousKey === panelMeasurementKey ? previousKey : panelMeasurementKey,
    );
  }, [panelMeasurementKey]);

  useEffect(() => {
    setMeasuredPanelKey(null);
    setStableSampleCount(0);
    lastMeasuredHeightRef.current = null;
  }, [panelMeasurementKey]);

  useEffect(() => {
    if (!enabled) {
      setMeasuredPanelKey(null);
      setStableSampleCount(0);
      lastMeasuredHeightRef.current = null;
      return;
    }

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
  }, [enabled, isMobile, itemCount, measurePanelHeight, suiteId]);

  return {
    hasMeasuredCurrentPanel: measuredPanelKey === panelMeasurementKey && stableSampleCount >= 2,
    measuredPanelHeight,
    panelMeasurementKey,
    panelMeasureRef,
  };
}
