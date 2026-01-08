import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Database, TrendingUp } from 'lucide-react';
import { AnomalyResult } from '@/lib/referenceDataset';

interface DatasetAnalysisResultsProps {
  result: AnomalyResult | null;
  isLoading: boolean;
  loadingStatus: string;
  referenceCount: number;
}

const DatasetAnalysisResults = ({ result, isLoading, loadingStatus, referenceCount }: DatasetAnalysisResultsProps) => {
  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">{loadingStatus || 'Processing...'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Comparing against {referenceCount} reference image(s)
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Upload an image to analyze</p>
          <p className="text-sm mt-2">
            {referenceCount > 0 
              ? `Ready to compare against ${referenceCount} reference image(s)`
              : 'Add reference images first to enable analysis'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    if (result.anomalyScore < 0.3) {
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Normal',
        progressColor: 'bg-green-500'
      };
    } else if (result.anomalyScore < 0.6) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Warning',
        progressColor: 'bg-yellow-500'
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Anomaly Detected',
        progressColor: 'bg-red-500'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-4">
      {/* Anomaly Score Card */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            Anomaly Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-3xl font-bold ${statusConfig.color}`}>
              {(result.anomalyScore * 100).toFixed(1)}%
            </span>
            <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
          <Progress 
            value={result.anomalyScore * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Higher score = more deviation from reference dataset
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      {result.summary && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Similarity Scores */}
      {result.similarityScores.length > 0 && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.similarityScores.slice(0, 3).map((item, index) => (
                <div key={item.imageId} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reference #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.similarity * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {(item.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Regions */}
      {result.anomalyRegions.length > 0 && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detected Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.anomalyRegions.map((region, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">Region {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={
                        region.severity === 'high' 
                          ? 'border-red-500 text-red-500' 
                          : region.severity === 'medium'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-green-500 text-green-500'
                      }
                    >
                      {region.severity}
                    </Badge>
                    <span className="text-sm font-medium">
                      {(region.score * 100).toFixed(0)}%
                    </span>
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

export default DatasetAnalysisResults;
