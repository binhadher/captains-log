'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Loader2, Check } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onRecordingDelete?: () => void;
  existingAudioUrl?: string;
  disabled?: boolean;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onRecordingDelete,
  existingAudioUrl,
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl && !existingAudioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, existingAudioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;

      // Try different MIME types for compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setDuration(recordingTime);
        onRecordingComplete(audioBlob, recordingTime);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    onRecordingDelete?.();
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlaybackTime(audioRef.current.currentTime);
    }
  };

  // If we have a recording, show playback controls
  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded}
          onTimeUpdate={handleTimeUpdate}
        />
        
        <button
          type="button"
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1">
          <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all"
              style={{ width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(playbackTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={deleteRecording}
          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Recording controls
  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <Mic className="w-5 h-5" />
          <span className="text-sm font-medium">Record Voice Note</span>
        </button>
      )}
    </div>
  );
}
