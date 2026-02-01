'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCcw, Check, Camera, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);

  // Check if device has multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.()
      .then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => setHasMultipleCameras(false));
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this browser');
      }

      // Try with facingMode first, fallback without it
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch {
        // Fallback: try without facingMode constraint (for devices with single camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      }

      streamRef.current = stream;
      
      // Verify stream has video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video track available');
      }
      console.log('Camera started:', videoTracks[0].label);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // iOS Safari needs these attributes set before srcObject
        video.setAttribute('autoplay', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        
        // Set the stream
        video.srcObject = stream;
        
        // iOS Safari: must call load() then play()
        video.load();
        
        // Wait for video to be ready and playing
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.play()
              .then(() => {
                // Double-check video has dimensions (iOS fix)
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                  // Wait a bit more for iOS
                  setTimeout(() => resolve(), 500);
                } else {
                  resolve();
                }
              })
              .catch(reject);
          };
          
          video.addEventListener('canplay', onCanPlay);
          video.onerror = () => reject(new Error('Video failed to load'));
          
          // Timeout fallback - iOS sometimes needs longer
          setTimeout(() => {
            video.removeEventListener('canplay', onCanPlay);
            video.play().catch(() => {});
            resolve();
          }, 3000);
        });
        
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is in use by another app. Please close other apps using the camera.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera does not support the required settings.');
        } else if (err.name === 'SecurityError') {
          setError('Camera access requires HTTPS. Please use a secure connection.');
        } else {
          setError(err.message || 'Failed to access camera');
        }
      } else {
        setError('Failed to access camera');
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const handleSwitchCamera = useCallback(async () => {
    stopCamera();
    setCapturedImage(null);
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If front camera, flip horizontally
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [stopCamera, facingMode]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to File
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    } catch (err) {
      setError('Failed to process photo');
    }
  }, [capturedImage, onCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (!capturedImage && !isLoading) {
      startCamera();
    }
  }, [facingMode]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent safe-area-inset-top">
        <button
          onClick={handleClose}
          className="p-3 rounded-full bg-black/40 text-white active:bg-black/60"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>
        {!capturedImage && hasMultipleCameras && (
          <button
            onClick={handleSwitchCamera}
            className="p-3 rounded-full bg-black/40 text-white active:bg-black/60"
            aria-label="Switch camera"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Camera/Preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative" style={{ minHeight: '200px' }}>
        {isLoading && !error ? (
          <div className="text-center p-8">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 max-w-sm">
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-red-400 mb-6 text-sm">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-teal-500 text-white rounded-lg font-medium active:bg-teal-600"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium active:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="h-full w-full object-cover"
            style={{ 
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              minHeight: '100%',
              minWidth: '100%',
              background: '#000'
            }}
          />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 flex justify-center items-center gap-12 bg-gradient-to-t from-black/70 to-transparent safe-area-inset-bottom">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="p-4 rounded-full bg-white/20 text-white active:bg-white/30"
              aria-label="Retake photo"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
            <button
              onClick={confirmPhoto}
              className="p-5 rounded-full bg-teal-500 text-white active:bg-teal-600"
              aria-label="Use this photo"
            >
              <Check className="w-10 h-10" />
            </button>
          </>
        ) : (
          <button
            onClick={takePhoto}
            disabled={!isStreaming || isLoading}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
            aria-label="Take photo"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
        )}
      </div>
    </div>
  );
}
