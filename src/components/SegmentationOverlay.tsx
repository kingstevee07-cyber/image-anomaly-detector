import React, { useEffect, useRef } from 'react';

interface SegmentationResult {
  label: string;
  score: number;
  mask?: {
    width: number;
    height: number;
    data: number[];
  };
}

interface SegmentationOverlayProps {
  imageUrl: string;
  segmentations: SegmentationResult[];
  showOverlay: boolean;
}

// Color palette for different segments
const SEGMENT_COLORS = [
  [0, 255, 255, 128],   // Cyan
  [255, 0, 128, 128],   // Pink
  [128, 255, 0, 128],   // Lime
  [255, 128, 0, 128],   // Orange
  [128, 0, 255, 128],   // Purple
  [0, 255, 128, 128],   // Mint
  [255, 255, 0, 128],   // Yellow
  [0, 128, 255, 128],   // Sky Blue
];

export const SegmentationOverlay: React.FC<SegmentationOverlayProps> = ({
  imageUrl,
  segmentations,
  showOverlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !showOverlay || segmentations.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to match container
      const container = containerRef.current!;
      const containerWidth = container.clientWidth;
      const aspectRatio = img.height / img.width;
      const containerHeight = containerWidth * aspectRatio;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw segmentation masks
      segmentations.forEach((segment, index) => {
        if (!segment.mask) return;

        const { width, height, data } = segment.mask;
        const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const maskIndex = y * width + x;
            const maskValue = data[maskIndex];

            if (maskValue > 0.5) {
              const canvasX = Math.floor(x * scaleX);
              const canvasY = Math.floor(y * scaleY);
              const pixelIndex = (canvasY * canvas.width + canvasX) * 4;

              // Blend with original pixel
              pixels[pixelIndex] = Math.min(255, pixels[pixelIndex] * 0.6 + color[0] * 0.4);
              pixels[pixelIndex + 1] = Math.min(255, pixels[pixelIndex + 1] * 0.6 + color[1] * 0.4);
              pixels[pixelIndex + 2] = Math.min(255, pixels[pixelIndex + 2] * 0.6 + color[2] * 0.4);
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      });

      // Add segment labels
      ctx.font = '14px Inter, sans-serif';
      ctx.textBaseline = 'top';
      segmentations.forEach((segment, index) => {
        const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
        const y = 10 + index * 24;
        
        // Draw background
        ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
        const text = `${segment.label} (${(segment.score * 100).toFixed(0)}%)`;
        const metrics = ctx.measureText(text);
        ctx.fillRect(8, y - 2, metrics.width + 20, 20);
        
        // Draw color indicator
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
        ctx.fillRect(10, y, 12, 14);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.fillText(text, 26, y);
      });
    };

    img.src = imageUrl;
  }, [imageUrl, segmentations, showOverlay]);

  if (!showOverlay || segmentations.length === 0) {
    return (
      <div ref={containerRef} className="relative w-full">
        <img src={imageUrl} alt="Original" className="w-full h-auto rounded-lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
    </div>
  );
};
