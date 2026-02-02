'use client'
'use client';

import { useEffect, useRef, useState } from 'react';

interface ValidationResult {
  isValid: boolean;
  instructions: string[];
  metrics: {
    brightness: number;
    blurScore: number;
    chartDetected: boolean;
    chartSize: number;
    hasColorBlocks: boolean;
  };
}

export default function DipstickValidator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        analyzeFrame();
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsAnalyzing(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const calculateBlur = (imageData: ImageData): number => {
    const { data, width, height } = imageData;
    const gray: number[] = [];
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Laplacian operator
    let variance = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian = 
          -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1] +
          -gray[idx - 1] + 8 * gray[idx] - gray[idx + 1] +
          -gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1];
        variance += laplacian * laplacian;
      }
    }
    
    return variance / (width * height);
  };

  const calculateBrightness = (imageData: ImageData): number => {
    const { data } = imageData;
    let sum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    
    return sum / (data.length / 4);
  };

  const detectColorBlocks = (imageData: ImageData): boolean => {
    const { data, width, height } = imageData;
    const colorVariance: number[] = [];
    const blockSize = 20;
    
    // Sample blocks across the image
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const colors: number[] = [];
        
        // Get colors in block
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = ((y + by) * width + (x + bx)) * 4;
            const hue = Math.atan2(
              Math.sqrt(3) * (data[idx + 1] - data[idx + 2]),
              2 * data[idx] - data[idx + 1] - data[idx + 2]
            );
            colors.push(hue);
          }
        }
        
        // Calculate variance
        const mean = colors.reduce((a, b) => a + b, 0) / colors.length;
        const variance = colors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / colors.length;
        colorVariance.push(variance);
      }
    }
    
    // Check if we have high color variance blocks (indicating color chart)
    const highVarianceBlocks = colorVariance.filter(v => v > 0.5).length;
    return highVarianceBlocks > 10; // At least 10 colorful blocks
  };

  const detectChartSize = (imageData: ImageData): number => {
    const { data, width, height } = imageData;
    let edgePixels = 0;
    
    // Simple edge detection - count high contrast areas
    for (let i = 0; i < data.length - 4; i += 4) {
      const diff = Math.abs(data[i] - data[i + 4]) + 
                   Math.abs(data[i + 1] - data[i + 5]) + 
                   Math.abs(data[i + 2] - data[i + 6]);
      if (diff > 100) edgePixels++;
    }
    
    // Return percentage of image with edges
    return (edgePixels / (width * height)) * 100;
  };

  const analyzeFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Run validations
    const brightness = calculateBrightness(imageData);
    const blurScore = calculateBlur(imageData);
    const hasColorBlocks = detectColorBlocks(imageData);
    const chartSize = detectChartSize(imageData);
    
    const instructions: string[] = [];
    let isValid = true;
    
    // Brightness check
    if (brightness < 80) {
      instructions.push('⚠️ Too dark - move to better lighting');
      isValid = false;
    } else if (brightness > 200) {
      instructions.push('⚠️ Too bright - reduce lighting or avoid glare');
      isValid = false;
    }
    
    // Blur check
    if (blurScore < 100) {
      instructions.push('⚠️ Image is blurry - hold camera steady');
      isValid = false;
    }
    
    // Chart detection
    if (!hasColorBlocks) {
      instructions.push('⚠️ Chart not detected - point camera at the color chart');
      isValid = false;
    }
    
    // Size check
    if (chartSize < 5) {
      instructions.push('⚠️ Move closer to the chart');
      isValid = false;
    } else if (chartSize > 25) {
      instructions.push('⚠️ Too close - move back slightly');
      isValid = false;
    }
    
    // Chart centering (simple check)
    const centerBrightness = calculateBrightness(
      ctx.getImageData(canvas.width / 3, canvas.height / 3, canvas.width / 3, canvas.height / 3)
    );
    if (Math.abs(centerBrightness - brightness) > 30) {
      instructions.push('ℹ️ Try to center the chart in frame');
    }
    
    if (isValid) {
      instructions.push('✅ Perfect! Hold steady and capture');
    }
    
    setValidation({
      isValid,
      instructions,
      metrics: {
        brightness,
        blurScore,
        chartDetected: hasColorBlocks,
        chartSize,
        hasColorBlocks
      }
    });
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageUrl);
    setIsAnalyzing(false);
  };

  const retake = () => {
    setCapturedImage(null);
    setIsAnalyzing(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Urine Dipstick Chart Validator</h1>
      
      <div className="relative w-full max-w-2xl">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border-4 border-gray-300"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-4 border-dashed border-white/50 rounded-lg" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
                Align chart here
              </div>
            </div>
          </>
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
        )}
      </div>
      
      {/* Validation feedback */}
      {validation && !capturedImage && (
        <div className={`w-full max-w-2xl p-4 rounded-lg ${
          validation.isValid ? 'bg-green-100 border-green-500' : 'bg-orange-100 border-orange-500'
        } border-2`}>
          <div className="space-y-2">
            {validation.instructions.map((instruction, idx) => (
              <div key={idx} className="text-sm font-medium">
                {instruction}
              </div>
            ))}
          </div>
          
          {/* Debug metrics */}
          <details className="mt-3 text-xs text-gray-600">
            <summary className="cursor-pointer">Debug Metrics</summary>
            <div className="mt-2 space-y-1">
              <div>Brightness: {validation.metrics.brightness.toFixed(1)}</div>
              <div>Blur Score: {validation.metrics.blurScore.toFixed(1)}</div>
              <div>Chart Size: {validation.metrics.chartSize.toFixed(1)}%</div>
              <div>Color Blocks: {validation.metrics.hasColorBlocks ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <button
            onClick={captureImage}
            disabled={!validation?.isValid}
            className={`px-6 py-3 rounded-lg font-medium ${
              validation?.isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            📸 Capture Image
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              🔄 Retake
            </button>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              ✓ Use This Image
            </button>
          </>
        )}
      </div>
    </div>
  );
}