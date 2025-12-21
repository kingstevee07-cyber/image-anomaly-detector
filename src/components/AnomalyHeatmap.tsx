import React, { useRef, useEffect } from 'react';
import { AnomalyRegion } from '@/lib/anomalyApi';

interface AnomalyHeatmapProps {
  imageUrl: string;
  regions: AnomalyRegion[];
  showOverlay: boolean;
}

const SEVERITY_COLORS = {
  low: { fill: 'rgba(255, 193, 7, 0.4)', stroke: '#FFC107' },
  medium: { fill: 'rgba(255, 152, 0, 0.5)', stroke: '#FF9800' },
  high: { fill: 'rgba(244, 67, 54, 0.6)', stroke: '#F44336' }
};

const AnomalyHeatmap: React.FC<AnomalyHeatmapProps> = ({ 
  imageUrl, 
  regions, 
  showOverlay 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showOverlay || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const containerWidth = containerRef.current?.clientWidth || 600;
      const scale = containerWidth / img.width;
      const displayHeight = img.height * scale;

      canvas.width = containerWidth;
      canvas.height = displayHeight;

      // Draw the original image
      ctx.drawImage(img, 0, 0, containerWidth, displayHeight);

      // Draw anomaly regions
      regions.forEach((region) => {
        const colors = SEVERITY_COLORS[region.severity] || SEVERITY_COLORS.low;
        
        const x = region.x * containerWidth;
        const y = region.y * displayHeight;
        const width = region.width * containerWidth;
        const height = region.height * displayHeight;

        // Draw filled region
        ctx.fillStyle = colors.fill;
        ctx.fillRect(x - width/2, y - height/2, width, height);

        // Draw border
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width/2, y - height/2, width, height);

        // Draw label
        const labelText = `${region.label} (${Math.round(region.score * 100)}%)`;
        ctx.font = 'bold 12px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const labelX = x - width/2;
        const labelY = y - height/2 - 5;

        // Label background
        ctx.fillStyle = colors.stroke;
        ctx.fillRect(labelX, labelY - 14, textMetrics.width + 8, 18);

        // Label text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, labelX + 4, labelY);
      });

      // Draw heatmap overlay for detected regions
      if (regions.length > 0) {
        ctx.globalCompositeOperation = 'multiply';
        
        regions.forEach((region) => {
          const x = region.x * containerWidth;
          const y = region.y * displayHeight;
          const radius = Math.max(region.width, region.height) * containerWidth * 0.7;
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          const intensity = region.score * 0.6;
          
          if (region.severity === 'high') {
            gradient.addColorStop(0, `rgba(244, 67, 54, ${intensity})`);
            gradient.addColorStop(0.5, `rgba(244, 67, 54, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
          } else if (region.severity === 'medium') {
            gradient.addColorStop(0, `rgba(255, 152, 0, ${intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 152, 0, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
          } else {
            gradient.addColorStop(0, `rgba(255, 193, 7, ${intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 193, 7, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
          }
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
        
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    img.src = imageUrl;
  }, [imageUrl, regions, showOverlay]);

  if (!showOverlay) {
    return (
      <div ref={containerRef} className="relative w-full">
        <img 
          src={imageUrl} 
          alt="Analyzed image" 
          className="w-full h-auto rounded-lg"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
};

export default AnomalyHeatmap;
