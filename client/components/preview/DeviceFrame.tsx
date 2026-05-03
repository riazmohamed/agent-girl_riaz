import React from 'react';
import type { Orientation } from '../../stores/previewStore';

interface DeviceFrameProps {
  frameType: 'iphone-15' | 'iphone-se' | 'pixel-8' | 'ipad';
  width: number;
  height: number;
  orientation: Orientation;
  children: React.ReactNode;
}

export function DeviceFrame({ frameType, width, height, orientation, children }: DeviceFrameProps) {
  const isLandscape = orientation === 'landscape';
  const displayWidth = isLandscape ? height : width;
  const displayHeight = isLandscape ? width : height;

  return (
    <div className={`device-frame device-frame-${frameType} ${isLandscape ? 'device-landscape' : ''}`}>
      {/* Top bezel */}
      <div className="device-bezel-top">
        {frameType === 'iphone-15' && (
          <div className="device-dynamic-island" />
        )}
        {frameType === 'pixel-8' && (
          <div className="device-punch-hole" />
        )}
        {frameType === 'iphone-se' && (
          <div className="device-speaker" />
        )}
      </div>

      {/* Screen area */}
      <div
        className="device-screen"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {children}
      </div>

      {/* Bottom bezel */}
      <div className="device-bezel-bottom">
        {frameType === 'iphone-se' && (
          <div className="device-home-button" />
        )}
      </div>

      {/* Side buttons (visual only) */}
      <div className="device-side-buttons">
        <div className="device-power-button" />
        <div className="device-volume-up" />
        <div className="device-volume-down" />
      </div>
    </div>
  );
}
