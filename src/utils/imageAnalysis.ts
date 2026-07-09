export type LocalizedImageAnalysis = {
  disease_detected: boolean | undefined;
  leading_hypothesis: {
    name: string;
    confidence: number;
    description: string;
    findings: string[];
  } | null;
  differential_diagnoses: Array<{
    name: string;
    confidence: number;
  }>;
  message: string | null;
  model: string | undefined;
  success: boolean | undefined;
};

export function getLocalizedImageAnalysis(imageAnalysis: unknown, language: string): LocalizedImageAnalysis | null {
  if (!imageAnalysis || typeof imageAnalysis !== 'object' || Array.isArray(imageAnalysis)) {
    return null;
  }

  const root = imageAnalysis as Record<string, unknown>;
  const isPortuguese = language.toLowerCase().startsWith('pt');
  const pt = isPortuguese && typeof root.pt === 'object' && root.pt !== null ? root.pt as Record<string, unknown> : null;

  const disease_detected = typeof root.disease_detected === 'boolean' ? root.disease_detected : undefined;

  let leading_hypothesis: LocalizedImageAnalysis['leading_hypothesis'] = null;
  const lhSource = pt?.leading_hypothesis ?? root.leading_hypothesis;
  if (lhSource && typeof lhSource === 'object' && !Array.isArray(lhSource)) {
    const lh = lhSource as Record<string, unknown>;
    leading_hypothesis = {
      name: typeof lh.name === 'string' ? lh.name : '',
      confidence: typeof lh.confidence === 'number' ? lh.confidence : 0,
      description: typeof lh.description === 'string' ? lh.description : '',
      findings: Array.isArray(lh.findings) ? lh.findings.filter((f): f is string => typeof f === 'string') : [],
    };
  }

  let differential_diagnoses: LocalizedImageAnalysis['differential_diagnoses'] = [];
  const ddSource = pt?.differential_diagnoses ?? root.differential_diagnoses;
  if (Array.isArray(ddSource)) {
    differential_diagnoses = ddSource
      .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
      .map((d) => ({
        name: typeof d.name === 'string' ? d.name : '',
        confidence: typeof d.confidence === 'number' ? d.confidence : 0,
      }));
  }

  const ptMessage = typeof pt?.message === 'string' ? pt.message : null;
  const rootMessage = typeof root.message === 'string' ? root.message : null;
  const message = ptMessage ?? rootMessage;
  const model = typeof root.model === 'string' ? root.model : undefined;
  const success = typeof root.success === 'boolean' ? root.success : undefined;

  return {
    disease_detected,
    leading_hypothesis,
    differential_diagnoses,
    message,
    model,
    success,
  };
}
