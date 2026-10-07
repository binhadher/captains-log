'use client';

import { useState } from 'react';
import { ImageIcon, AlertTriangle } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  showIcon?: boolean;
}

export function SafeImage({ 
  fallbackText = 'Image unavailable', 
  showIcon = true,
  className = '',
  alt = '',
  ...props 
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 ${className}`}>
        {showIcon && <AlertTriangle className="w-8 h-8 mb-2 opacity-60" />}
        <span className="text-xs text-center px-2">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-pulse" />
        </div>
      )}
      <img
        {...props}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={(e) => {
          setLoading(false);
          props.onLoad?.(e);
        }}
        onError={(e) => {
          setLoading(false);
          setError(true);
          props.onError?.(e);
        }}
      />
    </div>
  );
}
