import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

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

interface AnalysisResult {
  classifications: ClassificationResult[];
  segmentations: SegmentationResult[];
  anomalyScore: number;
}

let classifierPipeline: any = null;

export const loadModels = async (
  onProgress?: (status: string) => void
): Promise<void> => {
  try {
    if (!classifierPipeline) {
      onProgress?.('Loading AI model...');
      classifierPipeline = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224-in21k',
        { 
          progress_callback: (progress: any) => {
            if (progress.status === 'downloading') {
              const percent = progress.progress ? Math.round(progress.progress) : 0;
              onProgress?.(`Downloading model: ${percent}%`);
            }
          }
        }
      );
      onProgress?.('Model ready!');
    }
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load AI model. Please refresh and try again.');
  }
};

export const analyzeImage = async (
  imageUrl: string,
  onProgress?: (status: string) => void
): Promise<AnalysisResult> => {
  // Ensure models are loaded
  await loadModels(onProgress);

  onProgress?.('Analyzing image...');
  
  // Run classification
  const classificationResults = await classifierPipeline(imageUrl, {
    topk: 5,
  });

  const classifications: ClassificationResult[] = classificationResults.map(
    (result: any) => ({
      label: result.label,
      score: result.score,
    })
  );

  // Generate mock segmentation based on classification results
  // (Real segmentation models are too large for browser)
  const segmentations: SegmentationResult[] = classifications
    .slice(0, 3)
    .map((c, i) => ({
      label: c.label.split(',')[0],
      score: c.score * (1 - i * 0.1),
    }));

  // Calculate anomaly score based on classification confidence
  const topConfidence = classifications[0]?.score || 0;
  const confidenceSpread = classifications.slice(0, 3).reduce((acc, c) => acc + c.score, 0) / 3;
  
  // Anomaly score: inverse of confidence (low confidence = high anomaly)
  const anomalyScore = Math.max(0, Math.min(1, 1 - (topConfidence * 0.6 + confidenceSpread * 0.4)));

  onProgress?.('Complete!');

  return {
    classifications,
    segmentations,
    anomalyScore,
  };
};
