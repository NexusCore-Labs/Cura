// Screen 04: Camera / Scanner (Mobile)

export function renderCameraScanner() {
  return `
    <div class="flex flex-col relative w-full min-h-screen bg-inverse-surface select-none overflow-hidden">
      <!-- Background Viewfinder Graphic/Sample -->
      <div class="absolute inset-0 w-full h-full bg-cover bg-center" 
           style="background-image: url('/samples/cura_sample_image1.jpg'); filter: brightness(0.65);">
      </div>

      <!-- Scrim overlay -->
      <div class="absolute inset-0 bg-inverse-surface/40 pointer-events-none"></div>

      <!-- Top Action Bar -->
      <header class="relative z-10 flex items-center justify-between px-margin pt-safe pt-space-md">
        <a href="#/app" aria-label="Close Scanner" class="w-12 h-12 rounded-full bg-inverse-surface/60 backdrop-blur-md flex items-center justify-center text-surface-container-lowest active:bg-inverse-surface/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary">
          <span class="material-symbols-outlined text-[24px]">close</span>
        </a>
        <div class="w-12 h-12"></div>
      </header>

      <!-- Center Framing Area (Paper Rx Scanner Reticle) -->
      <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-margin my-space-xs">
        <div class="relative w-full max-w-[320px] aspect-[1/1.38] rounded-2xl flex items-center justify-center">
          <!-- Top-Left Corner Bracket -->
          <div class="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-surface-container-lowest rounded-tl-xl pointer-events-none"></div>
          <!-- Top-Right Corner Bracket -->
          <div class="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-surface-container-lowest rounded-tr-xl pointer-events-none"></div>
          <!-- Bottom-Left Corner Bracket -->
          <div class="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-surface-container-lowest rounded-bl-xl pointer-events-none"></div>
          <!-- Bottom-Right Corner Bracket -->
          <div class="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-surface-container-lowest rounded-br-xl pointer-events-none"></div>

          <!-- Real-time Scanner Laser Line -->
          <div class="absolute left-3 right-3 h-[2px] bg-primary-fixed opacity-80 shadow-[0_0_8px_rgba(178,247,80,0.8)] pointer-events-none" id="scan-line" style="top: 20%;"></div>
        </div>

        <!-- Guidance Instruction Pill -->
        <div class="mt-space-md bg-inverse-surface/85 backdrop-blur-md px-space-md py-2.5 rounded-full shadow-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-primary-fixed text-[18px]">fit_screen</span>
          <span class="font-body-semibold text-caption-bold text-surface-container-lowest tracking-wide">
            Lay it flat in bright light
          </span>
        </div>
      </div>

      <!-- Bottom Camera Controls -->
      <footer class="relative z-10 pb-safe pb-space-lg px-margin flex items-center justify-between">
        <!-- Secondary Upload Button -->
        <label for="camera-upload-input" class="h-14 px-space-md rounded-2xl bg-surface-container-lowest/90 backdrop-blur-md text-on-surface flex items-center gap-2 font-body-semibold text-caption-bold active:bg-surface-container-high transition-colors shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-primary">
          <span class="material-symbols-outlined text-[22px]">photo_library</span>
          <span>Upload</span>
          <input type="file" id="camera-upload-input" accept="image/*" class="sr-only" />
        </label>

        <!-- Main Shutter Button (Centered) -->
        <div class="flex items-center justify-center pr-10">
          <button type="button" 
                  id="shutter-btn" 
                  aria-label="Capture prescription photo" 
                  class="w-[72px] h-[72px] rounded-full p-1 bg-transparent border-2 border-surface-container-lowest flex items-center justify-center active:scale-95 transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-primary">
            <div class="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-md">
              <div class="w-14 h-14 rounded-full border border-secondary-container"></div>
            </div>
          </button>
        </div>

        <div class="w-4"></div>
      </footer>
    </div>
  `;
}

export function attachCameraListeners() {
  const scanLine = document.getElementById('scan-line');
  let pos = 15;
  let dir = 0.6;
  let rafId;

  function step() {
    pos += dir;
    if (pos > 85) dir = -0.6;
    if (pos < 15) dir = 0.6;
    if (scanLine) {
      scanLine.style.top = `${pos}%`;
      rafId = requestAnimationFrame(step);
    }
  }
  rafId = requestAnimationFrame(step);

  const shutterBtn = document.getElementById('shutter-btn');
  const uploadInput = document.getElementById('camera-upload-input');

  function triggerCapture() {
    cancelAnimationFrame(rafId);
    const flash = document.createElement('div');
    flash.className = 'absolute inset-0 bg-surface-container-lowest z-50 pointer-events-none transition-opacity duration-300';
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.remove();
        window.location.hash = '#/reading';
      }, 200);
    }, 60);
  }

  if (shutterBtn) {
    shutterBtn.addEventListener('click', triggerCapture);
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', () => {
      if (uploadInput.files && uploadInput.files.length > 0) {
        window.location.hash = '#/reading';
      }
    });
  }
}
