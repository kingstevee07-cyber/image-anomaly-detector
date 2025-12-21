import { supabase } from "@/integrations/supabase/client";

export interface AnomalyRegion {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'low' | 'medium' | 'high';
  score: number;
}

export interface Classification {
  label: string;
  score: number;
}

export interface AnomalyAnalysisResult {
  anomaly_score: number;
  status: 'normal' | 'warning' | 'anomaly_detected';
  classifications: Classification[];
  anomaly_regions: AnomalyRegion[];
  summary: string;
  defect_types: string[];
}

export const analyzeImageForAnomalies = async (
  imageFile: File,
  onProgress?: (status: string) => void
): Promise<AnomalyAnalysisResult> => {
  onProgress?.('Preparing image...');
  
  // Convert image to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  onProgress?.('Analyzing image with AI...');

  const { data, error } = await supabase.functions.invoke('analyze-anomaly', {
    body: { imageBase64: base64 }
  });

  if (error) {
    console.error('Analysis error:', error);
    throw new Error(error.message || 'Failed to analyze image');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  onProgress?.('Analysis complete!');

  return {
    anomaly_score: data.anomaly_score ?? 0,
    status: data.status ?? 'normal',
    classifications: data.classifications ?? [],
    anomaly_regions: data.anomaly_regions ?? [],
    summary: data.summary ?? '',
    defect_types: data.defect_types ?? []
  };
};
