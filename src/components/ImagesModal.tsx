"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

interface CapturedImageData {
  cloudinaryUrl: string;
  captureSecond: number;
  capturedAt?: string | null;
}

interface ImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  readingId: string;
  petName?: string;
}

export const ImagesModal: React.FC<ImagesModalProps> = ({
  isOpen,
  onClose,
  readingId,
  petName = "Reading"
}) => {
  const [images, setImages] = useState<CapturedImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && readingId) {
      fetchImages();
    }
  }, [isOpen, readingId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/readings/images/${readingId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      setImages(data.images || []);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${petName.replace(/\s+/g, '_')}_image_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const currentImage = images[currentIndex];
  const captureSecondText = useMemo(() => {
    return currentImage?.captureSecond ? `${currentImage?.captureSecond}s` : "N/A";
  }, [currentImage?.captureSecond]);
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl w-full mx-4">
      <div className="bg-white rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {petName} - Captured Images
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {images.length > 0 ? `Image ${currentIndex + 1} of ${images.length}` : "No images available"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-gray-500">Loading images...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={fetchImages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">No images available for this reading</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative bg-gray-50 rounded-xl overflow-hidden" style={{ minHeight: "400px" }}>
                <img
                  src={currentImage.cloudinaryUrl}
                  alt={`Captured at ${captureSecondText}`}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: "500px" }}
                />

                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  </>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(currentImage.cloudinaryUrl, currentIndex)}
                  className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                  title="Download image"
                >
                  <Download size={18} className="text-gray-700" />
                </button>
              </div>

              {/* Image Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Capture Time: {captureSecondText}
                  </p>
                  {currentImage.capturedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Captured: {new Date(currentImage.capturedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {images.length > 1 && (
                  <div className="flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex
                          ? "bg-blue-500"
                          : "bg-gray-300 hover:bg-gray-400"
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <img
                        src={image.cloudinaryUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-20 h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
