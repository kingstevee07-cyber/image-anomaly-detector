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
let segmenterPipeline: any = null;

export const loadModels = async (
  onProgress?: (status: string) => void
): Promise<void> => {
  try {
    if (!classifierPipeline) {
      onProgress?.('Loading classification model...');
      classifierPipeline = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
        { device: 'webgpu' }
      );
    }

    if (!segmenterPipeline) {
      onProgress?.('Loading segmentation model...');
      segmenterPipeline = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        { device: 'webgpu' }
      );
    }

    onProgress?.('Models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    // Fallback to CPU if WebGPU is not available
    try {
      if (!classifierPipeline) {
        onProgress?.('Loading classification model (CPU fallback)...');
        classifierPipeline = await pipeline(
          'image-classification',
          'Xenova/vit-base-patch16-224'
        );
      }

      if (!segmenterPipeline) {
        onProgress?.('Loading segmentation model (CPU fallback)...');
        segmenterPipeline = await pipeline(
          'image-segmentation',
          'Xenova/segformer-b0-finetuned-ade-512-512'
        );
      }
      onProgress?.('Models loaded successfully (CPU mode)');
    } catch (fallbackError) {
      console.error('Fallback loading failed:', fallbackError);
      throw fallbackError;
    }
  }
};

export const analyzeImage = async (
  imageUrl: string,
  onProgress?: (status: string) => void
): Promise<AnalysisResult> => {
  // Ensure models are loaded
  await loadModels(onProgress);

  onProgress?.('Running classification...');
  
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

  onProgress?.('Running segmentation...');

  // Run segmentation
  const segmentationResults = await segmenterPipeline(imageUrl);

  const segmentations: SegmentationResult[] = segmentationResults
    .filter((result: any) => result.score > 0.1)
    .slice(0, 8)
    .map((result: any) => ({
      label: result.label,
      score: result.score,
      mask: result.mask ? {
        width: result.mask.width,
        height: result.mask.height,
        data: Array.from(result.mask.data),
      } : undefined,
    }));

  // Calculate anomaly score based on classification confidence
  // Lower confidence in top predictions suggests anomaly
  const topConfidence = classifications[0]?.score || 0;
  const confidenceSpread = classifications.slice(0, 3).reduce((acc, c) => acc + c.score, 0) / 3;
  
  // Anomaly score: inverse of confidence (low confidence = high anomaly)
  // Also factor in if predictions are spread across many classes
  const anomalyScore = Math.max(0, Math.min(1, 1 - (topConfidence * 0.6 + confidenceSpread * 0.4)));

  onProgress?.('Analysis complete');

  return {
    classifications,
    segmentations,
    anomalyScore,
  };
};
