import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Camera({ onCapture, onUploadFile, onSelectSample }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [hasLiveStream, setHasLiveStream] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scanLinePos, setScanLinePos] = useState(20);
  const [flashing, setFlashing] = useState(false);

  // Start rear camera and guarantee all MediaStream tracks stop on unmount
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setHasLiveStream(true);
        }
      } catch (err) {
        if (!mounted) return;
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
        }
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Animate scanner laser line smoothly
  useEffect(() => {
    let pos = 15;
    let dir = 0.6;
    let rafId;

    function step() {
      pos += dir;
      if (pos > 85) dir = -0.6;
      if (pos < 15) dir = 0.6;
      setScanLinePos(pos);
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleShutterClick = () => {
    setFlashing(true);
    setTimeout(() => {
      setFlashing(false);
      if (hasLiveStream && videoRef.current && videoRef.current.readyState >= 2) {
        onCapture?.(videoRef.current);
      } else {
        onSelectSample?.('cura_sample_image1.jpg');
      }
    }, 180);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile?.(file);
    }
  };

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-inverse-surface select-none overflow-hidden">
      {/* Background Viewfinder Graphic / Sample */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: "url('/samples/cura_sample_image1.jpg')",
          filter: 'brightness(0.65)'
        }}
      />

      {/* Live Video Stream when camera permission is granted */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover ${
          hasLiveStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Scrim overlay */}
      <div className="absolute inset-0 bg-inverse-surface/40 pointer-events-none" />

      {/* Shutter Flash Effect */}
      {flashing && (
        <div className="absolute inset-0 bg-surface-container-lowest z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top Action Bar */}
      <header className="relative z-10 flex items-center justify-between px-margin pt-safe pt-space-md">
        <Link
          to="/app"
          aria-label="Close Scanner"
          className="w-12 h-12 rounded-full bg-inverse-surface/60 backdrop-blur-md flex items-center justify-center text-surface-container-lowest active:bg-inverse-surface/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </Link>
        <div className="w-12 h-12" />
      </header>

      {/* Center Framing Area (Paper Rx Scanner Reticle) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-margin my-space-xs">
        <div className="relative w-full max-w-[320px] aspect-[1/1.38] rounded-2xl flex items-center justify-center">
          {/* Top-Left Corner Bracket */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-surface-container-lowest rounded-tl-xl pointer-events-none" />
          {/* Top-Right Corner Bracket */}
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-surface-container-lowest rounded-tr-xl pointer-events-none" />
          {/* Bottom-Left Corner Bracket */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-surface-container-lowest rounded-bl-xl pointer-events-none" />
          {/* Bottom-Right Corner Bracket */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-surface-container-lowest rounded-br-xl pointer-events-none" />

          {/* Real-time Scanner Laser Line */}
          <div
            className="absolute left-3 right-3 h-[2px] bg-primary-fixed opacity-80 shadow-[0_0_8px_rgba(178,247,80,0.8)] pointer-events-none"
            style={{ top: `${scanLinePos}%` }}
          />
        </div>

        {/* Guidance Instruction Pill or Permission Denied Recovery */}
        {permissionDenied ? (
          <div
            role="status"
            className="mt-space-md bg-inverse-surface/90 backdrop-blur-md px-space-md py-2.5 rounded-2xl shadow-sm flex items-center gap-2 max-w-[320px] text-center"
          >
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">
              photo_library
            </span>
            <span className="font-body-semibold text-caption text-surface-container-lowest">
              Camera access denied. Use Upload to choose a photo.
            </span>
          </div>
        ) : (
          <div className="mt-space-md bg-inverse-surface/85 backdrop-blur-md px-space-md py-2.5 rounded-full shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed text-[18px]">
              fit_screen
            </span>
            <span className="font-body-semibold text-caption-bold text-surface-container-lowest tracking-wide">
              Lay it flat in bright light
            </span>
          </div>
        )}
      </div>

      {/* Bottom Camera Controls */}
      <footer className="relative z-10 pb-safe pb-space-lg px-margin flex items-center justify-between">
        {/* Secondary Upload Button */}
        <label
          htmlFor="camera-upload-input"
          className="h-14 px-space-md rounded-2xl bg-surface-container-lowest/90 backdrop-blur-md text-on-surface flex items-center gap-2 font-body-semibold text-caption-bold active:bg-surface-container-high transition-colors shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-primary"
        >
          <span className="material-symbols-outlined text-[22px]">photo_library</span>
          <span>Upload</span>
          <input
            type="file"
            id="camera-upload-input"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {/* Main Shutter Button (Centered) */}
        <div className="flex items-center justify-center pr-10">
          <button
            type="button"
            id="shutter-btn"
            aria-label="Capture prescription photo"
            onClick={handleShutterClick}
            className="w-[72px] h-[72px] rounded-full p-1 bg-transparent border-2 border-surface-container-lowest flex items-center justify-center active:scale-95 transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-md">
              <div className="w-14 h-14 rounded-full border border-secondary-container" />
            </div>
          </button>
        </div>

        <div className="w-4" />
      </footer>
    </div>
  );
}
