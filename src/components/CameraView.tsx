import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Camera, 
  Check, 
  CameraOff, 
  RefreshCw, 
  Upload, 
  Lock, 
  FlipHorizontal,
  Zap,
  ZapOff
} from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; isPermission?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stop current active stream tracks
  const stopActiveStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Start camera with resilient fallback cascade for mobile phones (iOS & Android)
  const startCamera = useCallback(async (targetFacing: 'environment' | 'user' = facingMode) => {
    setIsLoading(true);
    setError(null);
    setIsTorchOn(false);
    setHasTorch(false);

    // Stop previous stream if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        title: 'Brak obsługi kamery w przeglądarce',
        message: 'Twoja przeglądarka lub aplikacja blokuje bezpośredni strumień wideo. Użyj aparatu systemowego telefonu poniżej.',
      });
      setIsLoading(false);
      return;
    }

    let mediaStream: MediaStream | null = null;

    // Constraint cascades tailored for mobile browsers
    const constraintAttempts: MediaStreamConstraints[] = [
      // 1. Mobile rear/front camera with ideal dimensions
      {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      },
      // 2. Facing mode only (handles non-standard portrait resolutions on mobile)
      {
        video: {
          facingMode: { ideal: targetFacing },
        },
        audio: false,
      },
      // 3. Exact string facing mode
      {
        video: {
          facingMode: targetFacing,
        },
        audio: false,
      },
      // 4. Any video camera available
      {
        video: true,
        audio: false,
      },
    ];

    let lastError: any = null;

    for (const constraints of constraintAttempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err: any) {
        lastError = err;
        // If permission is explicitly denied, don't keep polling constraints
        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          err?.name === 'SecurityError'
        ) {
          break;
        }
      }
    }

    if (!mediaStream) {
      console.warn('Camera initialization failed with last error:', lastError);
      const isPerm =
        lastError?.name === 'NotAllowedError' ||
        lastError?.name === 'PermissionDeniedError' ||
        lastError?.name === 'SecurityError' ||
        (typeof lastError?.message === 'string' &&
          (lastError.message.toLowerCase().includes('permission') ||
            lastError.message.toLowerCase().includes('denied') ||
            lastError.message.toLowerCase().includes('not allowed')));

      if (isPerm) {
        setError({
          title: 'Brak uprawnień do aparatu',
          message:
            'Przeglądarka zablokowała dostęp do kamery na telefonie. Zezwól na dostęp w ustawieniach przeglądarki (ikona kłódki/uprawnień przy adresie strony) lub zrób zdjęcie bezpośrednio aparatem systemowym poniżej.',
          isPermission: true,
        });
      } else {
        setError({
          title: 'Nie można uruchomić kamery',
          message:
            'Wystąpił problem z podglądem wideo na żywo w tym telefonie. Kliknij poniżej, aby zrobić zdjęcie natywnym aparatem telefonu.',
        });
      }
      setIsLoading(false);
      return;
    }

    // Assign stream and trigger video play for iOS Safari & Android
    setStream(mediaStream);

    // Check for torch capability on mobile
    try {
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = (videoTrack.getCapabilities?.()) as any;
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(true);
      }
    } catch (e) {
      // capabilities might not be supported on all browsers
    }

    if (videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.srcObject = mediaStream;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.muted = true;

      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn('Video play error on mobile:', playErr);
          // Retry on user interaction / metadata load
          videoEl.onloadedmetadata = () => {
            videoEl.play().catch(() => {});
          };
        });
      }
    }

    setIsLoading(false);
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopActiveStream();
    };
  }, []);

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    try {
      const track = stream.getVideoTracks()[0];
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;

        // If front camera, un-mirror on capture for legible text
        if (facingMode === 'user') {
          context.translate(width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, width, height);

        const imageData = canvas.toDataURL('image/jpeg', 0.82);
        setIsCaptured(true);
        stopActiveStream();

        setTimeout(() => {
          onCapture(imageData);
        }, 400);
      }
    }
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setIsCaptured(true);
        stopActiveStream();
        setTimeout(() => {
          onCapture(base64);
        }, 200);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Hidden file input for native system camera fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFallbackFileSelect}
      />

      {/* Camera / Error Area */}
      <div className="relative flex-grow overflow-hidden flex items-center justify-center bg-zinc-950">
        {error ? (
          <div className="w-full max-w-sm mx-4 bg-zinc-900 border border-white/10 rounded-3xl p-7 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              {error.isPermission ? <Lock className="w-8 h-8" /> : <CameraOff className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{error.title}</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                {error.message}
              </p>
            </div>

            {/* Direct fallback action: System Camera / Gallery */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-black" />
                <span>Zrób zdjęcie aparatem telefonu</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Spróbuj ponownie</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-zinc-400 hover:text-zinc-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-zinc-400">Łączenie z aparatem...</span>
                </div>
              </div>
            )}

            {/* Top Toolbar (Torch & Camera Flip) */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-3 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                    isTorchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30' : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  aria-label="Włącz/wyłącz latarkę"
                >
                  {isTorchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors cursor-pointer"
                aria-label="Przełącz aparat (przód/tył)"
                title="Przełącz aparat"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Target Reticle UI */}
            {!isCaptured && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                <motion.div
                  animate={{
                    scale: [1.02, 0.98],
                    opacity: [0.65, 0.95],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    repeatType: 'reverse',
                  }}
                  className="w-full max-w-xs aspect-square border-2 border-emerald-500/70 rounded-3xl relative"
                >
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  <div className="absolute inset-x-0 bottom-4 text-center">
                    <span className="px-3.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                      Wyceluj w składniki produktu
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Zamknij podgląd"
          className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/75 transition-colors cursor-pointer z-20"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Controls Area */}
      <div className="h-36 bg-black border-t border-white/5 flex items-center justify-around px-8 relative">
        {/* Native phone camera button (100% reliable fallback on all mobile devices) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Aparat w telefonie"
          className="p-3.5 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300 rounded-2xl transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Camera className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-medium text-zinc-300">Aparat tel.</span>
        </button>

        {/* Shutter button */}
        <button
          onClick={capture}
          type="button"
          disabled={isCaptured || !!error || isLoading}
          aria-label="Zrób zdjęcie"
          className={`
            relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer
            ${
              isCaptured
                ? 'border-emerald-500 bg-emerald-500'
                : error || isLoading
                ? 'border-zinc-700 bg-zinc-800 opacity-40 cursor-not-allowed'
                : 'border-white bg-white/10 hover:bg-white/20 active:scale-95'
            }
          `}
        >
          {isCaptured ? (
            <Check className="w-10 h-10 text-white" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/80" />
          )}

          {!isCaptured && !error && !isLoading && (
            <div className="absolute -inset-2 border border-emerald-500/40 rounded-full animate-pulse" />
          )}
        </button>

        {/* Upload file fallback button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Wybierz zdjęcie z galerii"
          className="p-3.5 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300 rounded-2xl transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Upload className="w-5 h-5 text-zinc-400" />
          <span className="text-[10px] font-medium text-zinc-400">Galeria</span>
        </button>
      </div>
    </motion.div>
  );
};
