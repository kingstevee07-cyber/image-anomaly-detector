import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, AlertCircle, Target, Tag } from 'lucide-react';
import { AnomalyAnalysisResult, AnomalyRegion } from '@/lib/anomalyApi';

interface AnomalyResultsProps {
  result: AnomalyAnalysisResult | null;
  isLoading: boolean;
  loadingStatus: string;
}

const AnomalyResults: React.FC<AnomalyResultsProps> = ({ 
  result, 
  isLoading, 
  loadingStatus 
}) => {
  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-muted-foreground animate-pulse">{loadingStatus}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Upload an image to start anomaly detection analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = (status: string, score: number) => {
    if (status === 'normal' || score < 0.2) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Normal',
        progressColor: 'bg-green-500'
      };
    } else if (status === 'warning' || score < 0.5) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Warning',
        progressColor: 'bg-yellow-500'
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Anomaly Detected',
        progressColor: 'bg-red-500'
      };
    }
  };

  const statusConfig = getStatusConfig(result.status, result.anomaly_score);
  const StatusIcon = statusConfig.icon;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Anomaly Score Card */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Anomaly Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${statusConfig.bgColor}`}>
            <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className="text-2xl font-bold">
                  {(result.anomaly_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${statusConfig.progressColor}`}
                  style={{ width: `${result.anomaly_score * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {result.summary && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Detected Defects */}
      {result.defect_types && result.defect_types.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-primary" />
              Detected Defect Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.defect_types.map((defect, idx) => (
                <Badge key={idx} variant="outline" className="bg-destructive/10 text-destructive border-destructive/50">
                  {defect.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Regions */}
      {result.anomaly_regions && result.anomaly_regions.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Anomaly Regions ({result.anomaly_regions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.anomaly_regions.map((region, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${getSeverityColor(region.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{region.label}</p>
                      <p className="text-xs opacity-80">
                        Severity: {region.severity} • Confidence: {(region.score * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(region.severity)}>
                      {region.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classifications */}
      {result.classifications && result.classifications.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Classifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.classifications.slice(0, 5).map((cls, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{cls.label}</span>
                      <span className="text-muted-foreground">{(cls.score * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={cls.score * 100} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnomalyResults;
