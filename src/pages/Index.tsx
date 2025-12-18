import React, { useState, useCallback } from 'react';
import { Scan, Layers, BarChart3, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { AnalysisResults } from '@/components/AnalysisResults';
import { SegmentationOverlay } from '@/components/SegmentationOverlay';
import { analyzeImage } from '@/lib/anomalyDetection';
import { useToast } from '@/hooks/use-toast';

interface ClassificationResult {
  label: string;
  score: number;
}

interface SegmentationResult {
  label: string;
  score: number;
  mask?: {
    width: number;
    height: number;
    data: number[];
  };
}

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);
  const [segmentations, setSegmentations] = useState<SegmentationResult[]>([]);
  const [anomalyScore, setAnomalyScore] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const { toast } = useToast();

  const handleImageSelect = useCallback(async (file: File, url: string) => {
    setImageUrl(url);
    setIsProcessing(true);
    setClassifications([]);
    setSegmentations([]);
    setAnomalyScore(null);
    setLoadingStatus('Initializing...');

    try {
      const results = await analyzeImage(url, (status) => {
        console.log('Analysis status:', status);
        setLoadingStatus(status);
      });

      setClassifications(results.classifications);
      setSegmentations(results.segmentations);
      setAnomalyScore(results.anomalyScore);

      toast({
        title: "Analysis Complete",
        description: `Detected ${results.classifications.length} classifications and ${results.segmentations.length} segments.`,
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
                <h1 className="text-xl font-bold gradient-text">AnomaLib</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Anomaly Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Segmentation
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Classification
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  WebGPU
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
                Upload an image to analyze it using AI-powered segmentation and classification.
                Our system identifies anomalies and provides detailed insights.
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
                    {segmentations.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOverlay(!showOverlay)}
                      >
                        {showOverlay ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Overlay
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Overlay
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="glass rounded-xl p-4">
                    <SegmentationOverlay
                      imageUrl={imageUrl}
                      segmentations={segmentations}
                      showOverlay={showOverlay && !isProcessing}
                    />
                    {isProcessing && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-primary font-mono">{loadingStatus}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setImageUrl(null);
                      setClassifications([]);
                      setSegmentations([]);
                      setAnomalyScore(null);
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
              <AnalysisResults
                isLoading={isProcessing}
                classifications={classifications}
                segmentations={segmentations}
                anomalyScore={anomalyScore}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scan,
                title: "Anomaly Detection",
                description: "Identifies unusual patterns and outliers in your images using deep learning models.",
              },
              {
                icon: Layers,
                title: "Image Segmentation",
                description: "Breaks down images into meaningful segments for detailed analysis.",
              },
              {
                icon: BarChart3,
                title: "Classification",
                description: "Categorizes image content with confidence scores for each prediction.",
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
            Powered by Hugging Face Transformers.js • Running locally in your browser
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
