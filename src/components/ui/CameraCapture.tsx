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
  const capturedBlobRef = useRef<Blob | null>(null); // Store blob for iOS
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
    if (!streamRef.current) {
      setError('Camera not ready');
      return;
    }

    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined') {
      setError('Video recording not supported on this browser');
      return;
    }

    chunksRef.current = [];
    
    // Try MIME types in order of preference (iOS prefers mp4)
    const mimeTypes = [
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm',
      'video/quicktime',
    ];
    
    let selectedMimeType = '';
    for (const type of mimeTypes) {
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          console.log('Using MIME type:', type);
          break;
        }
      } catch {
        // isTypeSupported might throw on some browsers
        continue;
      }
    }

    try {
      const options: MediaRecorderOptions = {};
      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }
      // Reduce bitrate to keep file sizes manageable (1.5 Mbps video)
      options.videoBitsPerSecond = 1500000;

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      console.log('MediaRecorder created with options:', options);

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunksRef.current.length);
        
        // Stop camera first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clear timer if still running
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        if (chunksRef.current.length === 0) {
          console.error('No chunks captured');
          setError('No video data captured. Please try again.');
          setCapturedVideo(null);
          capturedBlobRef.current = null;
          // Don't set back to streaming - let user see error
          return;
        }

        try {
          const mimeType = selectedMimeType || mediaRecorder.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          console.log('Created blob:', blob.size, blob.type);
          
          if (blob.size === 0) {
            console.error('Empty blob');
            setError('Video capture failed. Please try again.');
            return;
          }

          // Store blob for later use (iOS sometimes loses the URL)
          capturedBlobRef.current = blob;
          
          const videoUrl = URL.createObjectURL(blob);
          console.log('Video URL created:', videoUrl);
          
          // Set state in specific order
          setCapturedVideo(videoUrl);
          setCapturedImage(null); // Clear any image
          setError(null);
          
          // Use setTimeout to ensure state updates before changing status
          setTimeout(() => {
            console.log('Setting status to captured');
            setStatus('captured');
          }, 50);
          
        } catch (err) {
          console.error('Error creating video blob:', err);
          setError('Failed to process video: ' + (err instanceof Error ? err.message : 'Unknown'));
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setStatus('streaming');
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      // Start recording - use smaller timeslice for iOS
      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setStatus('recording');
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('Recording started with state:', mediaRecorder.state);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setStatus('streaming');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    // Stop the timer first
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Request final data before stopping (helps with iOS)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Request any pending data
        mediaRecorderRef.current.requestData();
        // Small delay then stop (iOS needs this)
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }, 100);
      } catch (err) {
        console.error('Error stopping recording:', err);
        // Try to stop anyway
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedVideo(null);
    capturedBlobRef.current = null;
    setRecordingTime(0);
    setError(null);
    startCamera();
  };

  const confirmCapture = async () => {
    console.log('Confirming capture, image:', !!capturedImage, 'video:', !!capturedVideo, 'blob:', !!capturedBlobRef.current);
    setError(null);
    
    try {
      if (capturedImage) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      } else if (capturedVideo || capturedBlobRef.current) {
        // Use stored blob if available (more reliable on iOS)
        let blob: Blob;
        if (capturedBlobRef.current) {
          blob = capturedBlobRef.current;
          console.log('Using stored blob:', blob.size, blob.type);
        } else {
          const res = await fetch(capturedVideo!);
          blob = await res.blob();
          console.log('Fetched blob from URL:', blob.size, blob.type);
        }
        
        if (blob.size === 0) {
          setError('Video is empty. Please record again.');
          return;
        }
        
        // Determine extension from mime type
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video-${Date.now()}.${ext}`, { type: blob.type || 'video/webm' });
        console.log('Created file:', file.name, file.size, file.type);
        
        onCapture(file);
        onClose();
      } else {
        setError('No capture to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

        {(status === 'captured' || capturedBlobRef.current) && capturedVideo && (
          <video 
            src={capturedVideo}
            controls
            autoPlay
            loop
            playsInline
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
          {(status === 'captured' || capturedImage || capturedBlobRef.current) ? (
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
