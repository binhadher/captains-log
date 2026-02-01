'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCcw, Check, Camera, Loader2, SwitchCamera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'requesting' | 'streaming' | 'captured' | 'error'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.()
      .then(devices => {
        const cams = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(cams.length > 1);
      })
      .catch(() => {});
  }, []);

  // This must be called directly from a click handler for iOS
  const startCamera = async () => {
    setStatus('requesting');
    setError(null);

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      // Simple constraints - iOS works better with basic settings
      const constraints: MediaStreamConstraints = {
        video: useFrontCamera 
          ? { facingMode: 'user' }
          : { facingMode: 'environment' },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to any camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      // Assign stream and play - must happen synchronously for iOS
      video.srcObject = stream;
      
      // iOS needs this sequence
      video.onloadedmetadata = () => {
        video.play()
          .then(() => {
            setStatus('streaming');
          })
          .catch(err => {
            console.error('Play failed:', err);
            setError('Failed to start video playback');
            setStatus('error');
          });
      };

    } catch (err) {
      console.error('Camera error:', err);
      const message = err instanceof Error ? err.message : 'Camera access failed';
      
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow access in Settings.');
      } else if (message.includes('NotFound')) {
        setError('No camera found on this device.');
      } else {
        setError(message);
      }
      setStatus('error');
    }
  };

  const switchCamera = async () => {
    setUseFrontCamera(prev => !prev);
    // Restart with new camera after state updates
    setTimeout(() => startCamera(), 100);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Set canvas to video dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip for front camera
    if (useFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    
    // Stop the camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    setStatus('captured');
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    } catch {
      setError('Failed to save photo');
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Auto-start camera when component mounts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startCamera();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center">
        <button
          onClick={handleClose}
          className="p-3 rounded-full bg-black/50 text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        {status === 'streaming' && hasMultipleCameras && (
          <button
            onClick={switchCamera}
            className="p-3 rounded-full bg-black/50 text-white"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Video element - ALWAYS in DOM, visibility controlled by CSS */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: useFrontCamera ? 'scaleX(-1)' : 'none',
            opacity: status === 'streaming' ? 1 : 0,
            pointerEvents: status === 'streaming' ? 'auto' : 'none'
          }}
        />

        {/* Overlays based on status */}
        {(status === 'idle' || status === 'requesting') && (
          <div className="text-center p-8 z-10">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white">
              {status === 'requesting' ? 'Accessing camera...' : 'Initializing...'}
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center p-8 z-10">
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-red-400 mb-6 max-w-xs">{error}</p>
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="block w-full px-6 py-3 bg-teal-500 text-white rounded-lg"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="block w-full px-6 py-3 bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {status === 'captured' && capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-h-full max-w-full object-contain z-10"
          />
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8 flex justify-center items-center gap-8">
        {status === 'captured' ? (
          <>
            <button
              onClick={retake}
              className="p-4 rounded-full bg-white/20 text-white"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
            <button
              onClick={confirmPhoto}
              className="p-5 rounded-full bg-teal-500 text-white"
            >
              <Check className="w-10 h-10" />
            </button>
          </>
        ) : status === 'streaming' ? (
          <button
            onClick={takePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
