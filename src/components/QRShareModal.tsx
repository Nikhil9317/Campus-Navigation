import { Check, Copy, Download, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { CampusLocation } from '../types/campus';
import { CATEGORY_META, VERIFICATION_META } from '../utils/campusHelpers';

interface QRShareModalProps {
  location: CampusLocation | null;
  onClose: () => void;
}

export function QRShareModal({ location, onClose }: QRShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const shareUrl = location
    ? `${window.location.origin}${window.location.pathname}?dest=${encodeURIComponent(location.id)}&view=map`
    : '';

  useEffect(() => {
    if (!location || !shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [location, shareUrl]);

  if (!location) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${location.id}-lpu-qr.png`;
    a.click();
  };

  const catMeta = CATEGORY_META[location.category];
  const verMeta = VERIFICATION_META[location.verificationStatus];

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#2563EB]">
              <QrCode className="w-3.5 h-3.5" />
              <span>Campus QR Destination Sharing</span>
            </div>
            <h2 id="qr-modal-title" className="text-lg font-bold text-[#0F172A] mt-1">
              {location.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {catMeta.label} · <span className={verMeta.textClass}>{verMeta.label}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Close QR dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 flex flex-col items-center">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${location.name}`}
                className="w-52 h-52 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-xs text-slate-500">
                Generating QR code...
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 text-center mt-3 max-w-xs">
            Scan this QR code with any camera to open Campus Navigator with{' '}
            <strong className="text-[#0F172A]">{location.shortName || location.name}</strong>{' '}
            selected on the LPU map.
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-700 focus:outline-none truncate"
              aria-label="Shareable destination link"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link copied' : 'Copy link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Save QR PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
