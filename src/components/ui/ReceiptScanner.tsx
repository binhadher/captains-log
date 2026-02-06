'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, Receipt, RotateCcw, Check, Scan } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExtractedData {
  cost?: number;
  date?: string;
  vendor?: string;
  description?: string;
  confidence: number;
}

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedData, imageBlob: Blob) => void;
  onCancel: () => void;
}

export function ReceiptScanner({ onDataExtracted, onCancel }: ReceiptScannerProps) {
  const [mode, setMode] = useState<'camera' | 'preview' | 'processing'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        stopCamera();
        setMode('preview');
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const processReceipt = async () => {
    if (!capturedBlob) return;

    setMode('processing');
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('receipt', capturedBlob, 'receipt.jpg');

      // Call OCR API
      const response = await fetch('/api/receipt-scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const data = await response.json();
      setExtractedData(data);
      
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError('Could not extract data from receipt. Please enter manually.');
      setMode('preview');
    }
  };

  const confirmData = () => {
    if (extractedData && capturedBlob) {
      onDataExtracted(extractedData, capturedBlob);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setExtractedData(null);
    setMode('camera');
    setTimeout(startCamera, 100);
  };

  // Start camera on mount
  useState(() => {
    startCamera();
    return () => stopCamera();
  });

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Scan Receipt
          </h2>
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      {mode === 'camera' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[90%] max-w-md aspect-[3/4] border-2 border-white/50 rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
            </div>
          </div>

          <p className="absolute top-20 left-0 right-0 text-center text-white/80 text-sm">
            Position receipt within the frame
          </p>

          {/* Capture Button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-teal-400 flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Camera className="w-8 h-8 text-teal-600" />
            </button>
          </div>
        </>
      )}

      {/* Preview Mode */}
      {mode === 'preview' && capturedImage && (
        <>
          <img
            src={capturedImage}
            alt="Captured receipt"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />

          {error && (
            <div className="absolute top-20 left-4 right-4 p-3 bg-red-500/90 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="absolute bottom-8 left-4 right-4 flex gap-3">
            <Button
              onClick={retake}
              variant="outline"
              className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={processReceipt}
              className="flex-1 bg-teal-500 hover:bg-teal-600"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan Receipt
            </Button>
          </div>
        </>
      )}

      {/* Processing Mode */}
      {mode === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Scanning receipt...</p>
            <p className="text-white/60 text-sm mt-1">Extracting cost and date</p>
          </div>
        </div>
      )}

      {/* Results Mode */}
      {extractedData && mode === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Data Extracted</h3>
                <p className="text-sm text-gray-500">
                  {Math.round(extractedData.confidence * 100)}% confidence
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {extractedData.cost !== undefined && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Cost</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    AED {extractedData.cost.toLocaleString()}
                  </span>
                </div>
              )}
              {extractedData.date && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(extractedData.date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {extractedData.vendor && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Vendor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {extractedData.vendor}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={retake}
                variant="outline"
                className="flex-1"
              >
                Rescan
              </Button>
              <Button
                onClick={confirmData}
                className="flex-1"
              >
                Use Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
