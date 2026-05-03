import { usePreviewStore } from '../../stores/previewStore';
import { Smartphone, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function ExpoQRPreview() {
  const { expoQrUrl } = usePreviewStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!expoQrUrl) return;
    await navigator.clipboard.writeText(expoQrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!expoQrUrl) {
    return (
      <div className="preview-empty-state">
        <Smartphone size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
        <h3 className="preview-empty-title">Expo QR Code</h3>
        <p className="preview-empty-description">
          Start an Expo dev server to see the QR code here. Run <code>npx expo start</code> in your project directory.
        </p>
        <p className="preview-empty-description" style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
          The QR code will appear automatically when Expo is detected.
        </p>
      </div>
    );
  }

  return (
    <div className="expo-qr-container">
      {/* QR Code - rendered as a simple visual representation */}
      <div className="expo-qr-code">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(expoQrUrl)}&bgcolor=141618&color=DAEEFF`}
          alt="Expo QR Code"
          width={200}
          height={200}
          style={{ borderRadius: '8px' }}
        />
      </div>

      <p className="expo-qr-instruction">
        Scan with <strong>Expo Go</strong> on your phone
      </p>

      {/* URL display with copy */}
      <div className="expo-qr-url-row">
        <code className="expo-qr-url">{expoQrUrl}</code>
        <button
          className="preview-action-btn"
          onClick={handleCopy}
          title="Copy URL"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
