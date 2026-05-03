import React from 'react';

interface ResizeHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
}

export function ResizeHandle({ onPointerDown, onDoubleClick }: ResizeHandleProps) {
  return (
    <div
      className="preview-resize-handle"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize preview panel"
      tabIndex={0}
    >
      <div className="preview-resize-handle-line" />
    </div>
  );
}
