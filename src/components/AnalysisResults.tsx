import React from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassificationResult {
  label: string;
  score: number;
}

interface SegmentationResult {
  label: string;
  score: number;
  mask?: any;
}

interface AnalysisResultsProps {
  isLoading: boolean;
  classifications: ClassificationResult[];
  segmentations: SegmentationResult[];
  anomalyScore: number | null;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  isLoading,
  classifications,
  segmentations,
  anomalyScore,
}) => {
  const getAnomalyStatus = (score: number) => {
    if (score < 0.3) return { label: 'Normal', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle };
    if (score < 0.6) return { label: 'Warning', color: 'text-warning', bg: 'bg-warning/10', icon: Info };
    return { label: 'Anomaly Detected', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle };
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-muted-foreground">Processing image...</span>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-secondary/50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (classifications.length === 0 && segmentations.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Info className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Upload an image to start analysis</p>
        </div>
      </div>
    );
  }

  const status = anomalyScore !== null ? getAnomalyStatus(anomalyScore) : null;
  const StatusIcon = status?.icon || Info;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Anomaly Score */}
      {anomalyScore !== null && status && (
        <div className={cn("glass rounded-xl p-6", status.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("h-6 w-6", status.color)} />
              <div>
                <p className={cn("font-semibold text-lg", status.color)}>{status.label}</p>
                <p className="text-sm text-muted-foreground">Anomaly Detection Score</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-3xl font-mono font-bold", status.color)}>
                {(anomalyScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                anomalyScore < 0.3 ? "bg-success" : anomalyScore < 0.6 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${anomalyScore * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Classifications */}
      {classifications.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Classification Results
          </h3>
          <div className="space-y-3">
            {classifications.map((result, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{result.label.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${result.score * 100}%`, animationDelay: `${index * 100}ms` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground w-14 text-right">
                    {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segmentations */}
      {segmentations.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Segmentation Analysis
          </h3>
          <div className="flex flex-wrap gap-2">
            {segmentations.map((segment, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-secondary rounded-lg flex items-center gap-2"
              >
                <span className="text-sm font-medium capitalize">{segment.label.replace(/_/g, ' ')}</span>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {(segment.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
