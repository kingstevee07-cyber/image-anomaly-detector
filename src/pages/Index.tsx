import React, { useState, useCallback, useEffect } from 'react';
import { Scan, Layers, BarChart3, Eye, EyeOff, Zap, AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader } from '@/components/ImageUploader';
import AnomalyHeatmap from '@/components/AnomalyHeatmap';
import { ReferenceDatasetManager } from '@/components/ReferenceDatasetManager';
import { useToast } from '@/hooks/use-toast';
import {
  ReferenceImage,
  getReferenceImages,
  analyzeWithReferenceDataset,
  AnomalyResult
} from '@/lib/referenceDataset';
import { AnomalyRegion } from '@/lib/anomalyApi';
import DatasetAnalysisResults from '@/components/DatasetAnalysisResults';

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnomalyResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [activeTab, setActiveTab] = useState('analyze');
  const { toast } = useToast();

  const loadReferenceImages = useCallback(async () => {
    try {
      const images = await getReferenceImages();
      setReferenceImages(images);
    } catch (error) {
      console.error('Failed to load reference images:', error);
    }
  }, []);

  useEffect(() => {
    loadReferenceImages();
  }, [loadReferenceImages]);

  const handleImageSelect = useCallback(async (file: File, url: string) => {
    if (referenceImages.length === 0) {
      toast({
        title: "No Reference Dataset",
        description: "Please upload reference images first in the 'Reference Dataset' tab.",
        variant: "destructive",
      });
      setActiveTab('dataset');
      return;
    }

    setImageUrl(url);
    setIsProcessing(true);
    setAnalysisResult(null);
    setLoadingStatus('Initializing...');

    try {
      const result = await analyzeWithReferenceDataset(url, referenceImages, (status) => {
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
        description: `${statusMessage} • Score: ${(result.anomalyScore * 100).toFixed(1)}%`,
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
  }, [toast, referenceImages]);

  // Convert AnomalyResult regions to AnomalyRegion format
  const heatmapRegions: AnomalyRegion[] = analysisResult?.anomalyRegions.map(r => ({
    label: `Anomaly (${(r.score * 100).toFixed(0)}%)`,
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    severity: r.severity,
    score: r.score
  })) || [];

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
                <p className="text-xs text-muted-foreground">Reference-Based Anomaly Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-primary" />
                  Dataset: {referenceImages.length} images
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Localization
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  Local Processing
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="analyze" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Analyze Image
              </TabsTrigger>
              <TabsTrigger value="dataset" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Reference Dataset
                {referenceImages.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {referenceImages.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dataset" className="animate-fade-in">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Build Your Reference Dataset</h2>
                  <p className="text-muted-foreground">
                    Upload images that represent "normal" samples. New images will be compared against these to detect anomalies.
                  </p>
                </div>
                <ReferenceDatasetManager onDatasetChange={loadReferenceImages} />
              </div>
            </TabsContent>

            <TabsContent value="analyze" className="animate-fade-in">
              {/* Hero Section */}
              {!imageUrl && (
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Detect Anomalies Using <span className="gradient-text">Your Dataset</span>
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Upload an image to compare it against your reference dataset.
                    Our system calculates similarity scores and identifies deviations from normal patterns.
                  </p>
                  {referenceImages.length === 0 && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ No reference images uploaded. Please add reference images first.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setActiveTab('dataset')}
                      >
                        Go to Reference Dataset
                      </Button>
                    </div>
                  )}
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
                        {analysisResult && analysisResult.anomalyRegions.length > 0 && (
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
                          regions={heatmapRegions}
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
                  <DatasetAnalysisResults
                    result={analysisResult}
                    isLoading={isProcessing}
                    loadingStatus={loadingStatus}
                    referenceCount={referenceImages.length}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Reference-Based",
                description: "Build a dataset of normal samples. No external APIs needed - all processing happens locally.",
              },
              {
                icon: Layers,
                title: "Feature Extraction",
                description: "Extracts color histograms and texture features to compare images against your reference dataset.",
              },
              {
                icon: BarChart3,
                title: "Similarity Scoring",
                description: "Calculates similarity scores and highlights regions that deviate from normal patterns.",
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
            Reference-based anomaly detection • No external APIs required
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
