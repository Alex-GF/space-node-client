export interface FeatureEvaluationResult {
  eval: boolean;
  used: Record<string, number | boolean> | null;
  limit: Record<string, number | boolean> | null;
  error: {
    code: string;
    message: string;
  } | null;
}