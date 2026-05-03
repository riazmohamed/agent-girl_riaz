import { useCallback, useRef, useEffect } from 'react';
import { usePreviewStore } from '../stores/previewStore';

const MIN_CHAT_WIDTH_PX = 400;
const MIN_PREVIEW_WIDTH_PX = 320;

export function useResizablePanel() {
  const { panelWidthPercent, setPanelWidth, isPreviewOpen } = usePreviewStore();
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // Mouse position relative to the container's right edge = preview width
    const mouseX = e.clientX - containerRect.left;
    const previewWidthPx = containerWidth - mouseX;

    // Enforce minimum widths
    const chatWidthPx = containerWidth - previewWidthPx;
    if (chatWidthPx < MIN_CHAT_WIDTH_PX || previewWidthPx < MIN_PREVIEW_WIDTH_PX) {
      return;
    }

    const newPercent = (previewWidthPx / containerWidth) * 100;
    setPanelWidth(Math.round(newPercent * 10) / 10);
  }, [setPanelWidth]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleDoubleClick = useCallback(() => {
    // Toggle between 50/50 and collapsed
    if (panelWidthPercent > 45 && panelWidthPercent < 55) {
      setPanelWidth(30);
    } else {
      setPanelWidth(50);
    }
  }, [panelWidthPercent, setPanelWidth]);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    containerRef,
    panelWidthPercent: isPreviewOpen ? panelWidthPercent : 0,
    handlePointerDown,
    handleDoubleClick,
    isDragging,
  };
}
