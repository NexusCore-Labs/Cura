import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Camera from '../components/Camera.jsx';
import { processPrescriptionImage, processPrescriptionFile } from '../services/ocrService.js';
import { savePendingScan } from '../utils/storage.js';

export default function CameraScannerScreen() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToReading = (scan) => {
    savePendingScan(scan);
    navigate('/reading');
  };

  const handleUploadFile = async (file) => {
    setError(null);
    setBusy(true);
    try {
      const scan = await processPrescriptionFile(file);
      goToReading(scan);
    } catch (err) {
      setError(err?.message || 'We could not read that file. Please try a JPG, PNG or PDF.');
      setBusy(false);
    }
  };

  const handleCapture = async (videoElement) => {
    setError(null);
    setBusy(true);
    try {
      const processed = await processPrescriptionImage(videoElement);
      goToReading({ kind: 'image', ...processed, fileName: 'camera-capture.jpg' });
    } catch (err) {
      setError(err?.message || 'We could not capture that photo. Please try again.');
      setBusy(false);
    }
  };

  const handleSelectSample = (sampleName) => {
    setError(null);
    goToReading({ kind: 'sample', sampleName });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        goToReading({ kind: 'sample', sampleName: 'cura_sample_image1.jpg' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Camera
      isDesktop={isDesktop}
      busy={busy}
      error={error}
      onCapture={handleCapture}
      onUploadFile={handleUploadFile}
      onSelectSample={handleSelectSample}
    />
  );
}
