import React, { useState, useCallback } from 'react';
import { Scan, Layers, BarChart3, Eye, EyeOff, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import AnomalyResults from '@/components/AnomalyResults';
import AnomalyHeatmap from '@/components/AnomalyHeatmap';
import { analyzeImageForAnomalies, AnomalyAnalysisResult } from '@/lib/anomalyApi';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnomalyAnalysisResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const { toast } = useToast();

  const handleImageSelect = useCallback(async (file: File, url: string) => {
    setImageUrl(url);
    setImageFile(file);
    setIsProcessing(true);
    setAnalysisResult(null);
    setLoadingStatus('Initializing...');

    try {
      const result = await analyzeImageForAnomalies(file, (status) => {
        console.log('Analysis status:', status);
        setLoadingStatus(status);
      });

      setAnalysisResult(result);

      const statusMessage = result.status === 'normal' 
        ? 'No anomalies detected' 
        : result.status === 'warning'
        ? 'Minor anomalies found'
        : 'Anomalies detected!';

      toast({
        title: "Analysis Complete",
        description: `${statusMessage} • Score: ${(result.anomaly_score * 100).toFixed(1)}%`,
        variant: result.status === 'anomaly_detected' ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setLoadingStatus('');
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Anomalib</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Anomaly Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Defect Detection
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Localization
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  AI-Powered
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          {!imageUrl && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Detect Anomalies in <span className="gradient-text">Your Images</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload an image to analyze it using AI-powered anomaly detection.
                Our system identifies defects, irregularities, and provides detailed localization.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Image Upload & Display */}
            <div className="space-y-4">
              {!imageUrl ? (
                <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Image Analysis</h3>
                    {analysisResult && analysisResult.anomaly_regions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOverlay(!showOverlay)}
                      >
                        {showOverlay ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Heatmap
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Heatmap
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="glass rounded-xl p-4">
                    <AnomalyHeatmap
                      imageUrl={imageUrl}
                      regions={analysisResult?.anomaly_regions || []}
                      showOverlay={showOverlay && !isProcessing && !!analysisResult}
                    />
                    {isProcessing && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-primary font-mono animate-pulse">{loadingStatus}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setImageUrl(null);
                      setImageFile(null);
                      setAnalysisResult(null);
                    }}
                  >
                    Analyze Another Image
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <AnomalyResults
                result={analysisResult}
                isLoading={isProcessing}
                loadingStatus={loadingStatus}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: AlertTriangle,
                title: "Anomaly Detection",
                description: "Identifies defects, scratches, dents, and irregularities using advanced AI vision models.",
              },
              {
                icon: Layers,
                title: "Anomaly Localization",
                description: "Pinpoints exact regions with anomalies, showing heatmaps and bounding boxes.",
              },
              {
                icon: BarChart3,
                title: "Confidence Scoring",
                description: "Provides anomaly scores and severity levels for quality control decisions.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Powered by Lovable AI • Industrial-grade anomaly detection
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
