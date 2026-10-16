import React from 'react';
import { useNavigate } from 'react-router-dom';
import Camera from '../components/Camera.jsx';
import { processPrescriptionImage } from '../services/ocrService.js';

export default function CameraScannerScreen() {
  const navigate = useNavigate();

  const handleCapture = async (videoElement) => {
    try {
      await processPrescriptionImage(videoElement);
    } catch (_) {
      // Proceed to reading screen with sample fallback if video frame extraction fails
    }
    navigate('/reading');
  };

  const handleUploadFile = async (file) => {
    try {
      await processPrescriptionImage(file);
      navigate(`/reading?sample=${encodeURIComponent(file.name || '')}`);
    } catch (_) {
      navigate('/reading');
    }
  };

  const handleSelectSample = (sampleName) => {
    navigate(`/reading?sample=${encodeURIComponent(sampleName)}`);
  };

  return (
    <Camera
      onCapture={handleCapture}
      onUploadFile={handleUploadFile}
      onSelectSample={handleSelectSample}
    />
  );
}
