'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, RotateCcw, Check, Camera, Loader2, Video, Square } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  mode?: 'photo' | 'video' | 'both';
}

export function CameraCapture({ onCapture, onClose, mode = 'both' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'requesting' | 'streaming' | 'recording' | 'captured' | 'error'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>(mode === 'video' ? 'video' : 'photo');
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
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

  const startCamera = async () => {
    setStatus('requesting');
    setError(null);

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      // Include audio for video recording
      const needsAudio = mode !== 'photo';
      const constraints: MediaStreamConstraints = {
        video: useFrontCamera 
          ? { facingMode: 'user' }
          : { facingMode: 'environment' },
        audio: needsAudio
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback without audio
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      // Wait for video element to be available
      let video = videoRef.current;
      let attempts = 0;
      while (!video && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        video = videoRef.current;
        attempts++;
      }
      
      if (!video) {
        throw new Error('Camera initialization failed. Please try again.');
      }

      // Assign stream and play
      video.srcObject = stream;
      
      // Wait for video to be ready then play
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play()
            .then(() => resolve())
            .catch(reject);
        };
        video.onerror = () => reject(new Error('Video failed to load'));
        setTimeout(() => resolve(), 2000);
      });
      
      setStatus('streaming');

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
    setTimeout(() => startCamera(), 100);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    // Try to use a supported mime type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    
    let selectedMimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType || undefined
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType || 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setCapturedVideo(videoUrl);
        setStatus('captured');
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setStatus('recording');
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedVideo(null);
    setRecordingTime(0);
    startCamera();
  };

  const confirmCapture = async () => {
    try {
      if (capturedImage) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      } else if (capturedVideo) {
        const res = await fetch(capturedVideo);
        const blob = await res.blob();
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        onCapture(file);
      }
      onClose();
    } catch {
      setError('Failed to save');
    }
  };

  const handleClose = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-start camera when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current) {
        startCamera();
      } else {
        setTimeout(() => startCamera(), 200);
      }
    }, 300);
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
        
        {/* Recording indicator */}
        {status === 'recording' && (
          <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
        
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
        {/* Video element - ALWAYS in DOM */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: useFrontCamera ? 'scaleX(-1)' : 'none',
            opacity: (status === 'streaming' || status === 'recording') ? 1 : 0,
            pointerEvents: (status === 'streaming' || status === 'recording') ? 'auto' : 'none'
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

        {status === 'captured' && capturedVideo && (
          <video 
            src={capturedVideo}
            controls
            autoPlay
            loop
            className="max-h-full max-w-full object-contain z-10"
          />
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-10">
        {/* Mode switcher - only show when streaming and mode is 'both' */}
        {status === 'streaming' && mode === 'both' && (
          <div className="flex justify-center mb-6">
            <div className="bg-black/50 rounded-full p-1 flex gap-1">
              <button
                onClick={() => setCaptureMode('photo')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  captureMode === 'photo' 
                    ? 'bg-white text-black' 
                    : 'text-white'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => setCaptureMode('video')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  captureMode === 'video' 
                    ? 'bg-white text-black' 
                    : 'text-white'
                }`}
              >
                Video
              </button>
            </div>
          </div>
        )}

        {/* Capture controls */}
        <div className="flex justify-center items-center gap-8">
          {status === 'captured' ? (
            <>
              <button
                onClick={retake}
                className="p-4 rounded-full bg-white/20 text-white"
              >
                <RotateCcw className="w-8 h-8" />
              </button>
              <button
                onClick={confirmCapture}
                className="p-5 rounded-full bg-teal-500 text-white"
              >
                <Check className="w-10 h-10" />
              </button>
            </>
          ) : status === 'streaming' ? (
            captureMode === 'photo' ? (
              // Photo capture button
              <button
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            ) : (
              // Video record button
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-red-500" />
              </button>
            )
          ) : status === 'recording' ? (
            // Stop recording button
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center active:scale-95 transition-transform bg-red-500/20"
            >
              <Square className="w-10 h-10 text-white fill-white" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
