import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export const ACCEPTED_SCAN_TYPES = '.jpg,.jpeg,.png,.pdf';

const SAMPLES = [
  { file: 'cura_sample_image1.jpg', label: 'Handwritten Rx' },
  { file: 'cura_sample_image2.webp', label: 'Typed Rx' },
  { file: 'cura_sample_image3.jpg', label: 'Weekly regimen' }
];

function SampleRow({ onSelectSample }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="font-caption text-caption text-muted-text">No prescription handy?</span>
      {SAMPLES.map((sample) => (
        <button
          key={sample.file}
          type="button"
          onClick={() => onSelectSample?.(sample.file)}
          className="h-9 px-3 rounded-full border border-card-border bg-surface-container-lowest text-on-surface font-caption-bold text-caption hover:bg-surface-container transition-colors"
        >
          {sample.label}
        </button>
      ))}
    </div>
  );
}

function UploadInput({ id, onUploadFile, className, label, icon, capture }) {
  return (
    <label htmlFor={id} className={className}>
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span>{label}</span>
      <input
        type="file"
        id={id}
        accept={ACCEPTED_SCAN_TYPES}
        capture={capture}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadFile?.(file);
          e.target.value = '';
        }}
        className="sr-only"
      />
    </label>
  );
}

/**
 * Prescription capture.
 *
 * Mobile (< 1024px): live rear camera with a shutter, plus gallery/files upload.
 * Desktop (>= 1024px): no camera access at all — upload a PDF or image file.
 *
 * Supported files everywhere: jpg, jpeg, png and pdf.
 */
export default function Camera({
  onCapture,
  onUploadFile,
  onSelectSample,
  isDesktop = false,
  busy = false,
  error = null
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [hasLiveStream, setHasLiveStream] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scanLinePos, setScanLinePos] = useState(20);
  const [flashing, setFlashing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Start the rear camera (mobile only) and always stop every track on unmount.
  useEffect(() => {
    if (isDesktop) return undefined;

    let mounted = true;

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionDenied(true);
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
        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          err?.name === 'NotFoundError'
        ) {
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
  }, [isDesktop]);

  // Animate the scanner laser line (mobile viewfinder only).
  useEffect(() => {
    if (isDesktop) return undefined;
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
  }, [isDesktop]);

  const handleShutterClick = () => {
    setFlashing(true);
    setTimeout(() => {
      setFlashing(false);
      if (hasLiveStream && videoRef.current && videoRef.current.readyState >= 2) {
        onCapture?.(videoRef.current);
      } else {
        onSelectSample?.(SAMPLES[0].file);
      }
    }, 180);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) onUploadFile?.(file);
  };

  if (isDesktop) {
    return (
      <div className="bg-background font-body text-body text-on-surface min-h-screen flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-card-border shadow-sm">
          <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-lime">
                <span className="material-symbols-outlined text-[24px]">medication</span>
              </div>
              <span className="font-headline-2 text-headline-2 text-on-surface font-bold">
                Cura
              </span>
            </Link>
            <Link
              to="/app"
              className="h-11 px-space-md rounded-2xl border border-card-border text-on-surface font-body-semibold text-[16px] inline-flex items-center gap-2 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              Close
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-margin">
            <span className="font-caption-bold text-caption text-primary tracking-wide uppercase">
              Scan prescription
            </span>
            <h1 className="font-headline-1 text-headline-1 text-on-surface font-bold mt-2">
              Upload the prescription sheet
            </h1>
            <p className="font-body text-body text-muted-text mt-2">
              Add a photo or a PDF of the paper prescription. Cura reads it and shows you what it
              understood before anything is saved.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`mt-8 rounded-3xl border-2 border-dashed p-10 bg-surface-container-lowest flex flex-col items-center text-center transition-colors ${
                dragActive ? 'border-primary bg-surface-container' : 'border-card-border'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[34px]">upload_file</span>
              </div>
              <h2 className="font-headline-2 text-headline-2 text-on-surface mt-4">
                Drop your file here
              </h2>
              <p className="font-caption text-caption text-muted-text mt-1">
                Supported formats: PDF, JPG, JPEG and PNG · up to 4 MB
              </p>

              <UploadInput
                id="desktop-scan-upload"
                onUploadFile={onUploadFile}
                icon="folder_open"
                label={busy ? 'Reading prescription…' : 'Choose file from this computer'}
                className={`mt-6 h-14 px-8 rounded-2xl inline-flex items-center gap-2 font-body-semibold text-body-semibold shadow-sm transition-all cursor-pointer ${
                  busy
                    ? 'bg-surface-container text-muted-text pointer-events-none'
                    : 'bg-primary-container text-on-lime hover:opacity-95'
                }`}
              />

              <p className="font-caption text-caption text-muted-text mt-3">
                Camera capture is not used on desktop.
              </p>
            </div>

            {error && (
              <p role="alert" className="mt-4 font-caption text-caption text-error text-center">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center gap-3">
              <SampleRow onSelectSample={onSelectSample} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-inverse-surface select-none overflow-hidden">
      {/* Dimmed fallback backdrop until the camera stream is live */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: "url('/samples/cura_sample_image1.jpg')",
          filter: 'brightness(0.6)'
        }}
      />

      {/* Live video stream when camera permission is granted */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover ${
          hasLiveStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div className="absolute inset-0 bg-inverse-surface/40 pointer-events-none" />

      {flashing && (
        <div className="absolute inset-0 bg-surface-container-lowest z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top action bar */}
      <header className="relative z-10 flex items-center justify-between px-margin pt-safe pt-space-md">
        <Link
          to="/app"
          aria-label="Close scanner"
          className="w-12 h-12 rounded-full bg-inverse-surface/60 backdrop-blur-md flex items-center justify-center text-surface-container-lowest active:bg-inverse-surface/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </Link>
        <div className="w-12 h-12" />
      </header>

      {/* Center framing reticle */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-margin my-space-xs">
        <div className="relative w-full max-w-[320px] aspect-[1/1.38] rounded-2xl flex items-center justify-center">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-surface-container-lowest rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-surface-container-lowest rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-surface-container-lowest rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-surface-container-lowest rounded-br-xl pointer-events-none" />

          <div
            className="absolute left-3 right-3 h-[2px] bg-primary-fixed opacity-80 shadow-[0_0_8px_rgba(59,217,121,0.8)] pointer-events-none"
            style={{ top: `${scanLinePos}%` }}
          />
        </div>

        {permissionDenied ? (
          <div
            role="status"
            className="mt-space-md bg-inverse-surface/90 backdrop-blur-md px-space-md py-3 rounded-2xl shadow-sm flex flex-col items-center gap-3 max-w-[340px] text-center"
          >
            <span className="font-body-semibold text-caption text-surface-container-lowest">
              Camera access denied. Upload a photo or PDF instead.
            </span>
            <UploadInput
              id="mobile-camera-fallback"
              onUploadFile={onUploadFile}
              capture="environment"
              icon="photo_camera"
              label="Open phone camera"
              className="h-12 px-space-md rounded-xl bg-primary-container text-on-lime inline-flex items-center gap-2 font-body-semibold text-caption-bold cursor-pointer"
            />
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

        {error && (
          <p role="alert" className="mt-3 font-caption text-caption text-tertiary-fixed-dim text-center max-w-[320px]">
            {error}
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <footer className="relative z-10 pb-safe pb-space-lg px-margin flex flex-col gap-4">
        <UploadInput
          id="mobile-gallery-upload"
          onUploadFile={onUploadFile}
          icon="photo_library"
          label="Gallery / Files"
          className="h-11 px-space-md rounded-2xl bg-surface-container-lowest/90 backdrop-blur-md text-on-surface inline-flex items-center gap-2 font-body-semibold text-caption-bold shadow-sm cursor-pointer self-center"
        />

        <div className="flex items-center justify-center">
          <button
            type="button"
            id="shutter-btn"
            aria-label="Capture prescription photo"
            onClick={handleShutterClick}
            disabled={busy}
            className="w-[72px] h-[72px] rounded-full p-1 bg-transparent border-2 border-surface-container-lowest flex items-center justify-center active:scale-95 transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-md">
              <div className="w-14 h-14 rounded-full border border-secondary-container" />
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
}
