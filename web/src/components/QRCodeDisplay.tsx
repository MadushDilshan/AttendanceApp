import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { rotateQr } from '../services/workplaceService';

export default function QRCodeDisplay(): JSX.Element {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState('');

  const loadQr = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    // Revoke previous blob URL to avoid memory leak
    setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    try {
      const res = await apiClient.get<Blob>('/admin/workplace/qr', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setBlobUrl(url);
    } catch {
      setError('Could not load QR code. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQr();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadQr]);

  const handleDownloadPng = (): void => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'workplace-qr.png';
    a.click();
  };

  const handlePrintPdf = (): void => {
    if (!blobUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Workplace QR Code</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            img { width: 300px; height: 300px; }
            p { margin-top: 16px; font-size: 14px; color: #555; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <img src="${blobUrl}" alt="Workplace QR Code" />
          <p>Scan this QR code to record attendance</p>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleRotate = async (): Promise<void> => {
    if (!confirm('Rotating the QR code will invalidate the current one. Employees must re-scan the new code. Continue?')) return;
    setRotating(true);
    try {
      await rotateQr();
      await loadQr();
    } catch {
      setError('Failed to rotate QR code. Please try again.');
    } finally {
      setRotating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fff', width: 216, height: 216, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading && <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading…</div>}
        {!loading && blobUrl && (
          <img src={blobUrl} alt="Workplace QR Code" width={200} height={200} style={{ display: 'block' }} />
        )}
      </div>

      {error && (
        <div style={{ color: '#991b1b', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>
      )}

      <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
        Print this QR code and display it at the workplace entrance.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleDownloadPng}
          disabled={!blobUrl || loading}
          style={{ padding: '0.4rem 0.9rem', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', cursor: (!blobUrl || loading) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: (!blobUrl || loading) ? 0.6 : 1 }}
        >
          Download PNG
        </button>
        <button
          onClick={handlePrintPdf}
          disabled={!blobUrl || loading}
          style={{ padding: '0.4rem 0.9rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '4px', cursor: (!blobUrl || loading) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: (!blobUrl || loading) ? 0.6 : 1 }}
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => void handleRotate()}
          disabled={rotating || loading}
          style={{ padding: '0.4rem 0.9rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24', borderRadius: '4px', cursor: (rotating || loading) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: (rotating || loading) ? 0.7 : 1 }}
        >
          {rotating ? 'Rotating…' : 'Rotate QR Code'}
        </button>
      </div>
    </div>
  );
}
