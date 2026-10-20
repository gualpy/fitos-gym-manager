import { apiRequest } from './api';

export interface Measurement {
  id: string;
  measuredOn: string;
  weightKg: number;
  heightCm: number;
}

export interface MeasurementInput {
  measuredOn?: string;
  weightKg: number;
  heightCm: number;
}

const base = (customerId: string) => `/customers/${customerId}/measurements`;

export const listMeasurements = (customerId: string) => apiRequest<Measurement[]>(base(customerId), { auth: true });

export const recordMeasurement = (customerId: string, input: MeasurementInput) =>
  apiRequest<Measurement>(base(customerId), { method: 'POST', body: input, auth: true });

export const deleteMeasurement = (customerId: string, id: string) =>
  apiRequest<void>(`${base(customerId)}/${id}`, { method: 'DELETE', auth: true });

// ---- Body mass index (display only: the API stores weight and height, never a diagnosis) ------------------------

/** WHO cut-offs for adults. The healthy range is the weight that puts the BMI between the first two. */
const BMI_HEALTHY_MIN = 18.5;
const BMI_HEALTHY_MAX = 24.9;

export type BmiCategory = 'under' | 'healthy' | 'over' | 'obese';

export const bmiOf = (weightKg: number, heightCm: number): number => weightKg / (heightCm / 100) ** 2;

export const bmiCategory = (bmi: number): BmiCategory =>
  bmi < BMI_HEALTHY_MIN ? 'under' : bmi < 25 ? 'healthy' : bmi < 30 ? 'over' : 'obese';

export const BMI_LABELS: Record<BmiCategory, string> = {
  under: 'Bajo peso',
  healthy: 'Peso saludable',
  over: 'Sobrepeso',
  obese: 'Obesidad',
};

/** Weight range (kg) that keeps the BMI in the healthy band for a height. */
export const healthyRange = (heightCm: number): { min: number; max: number } => {
  const m2 = (heightCm / 100) ** 2;
  return { min: BMI_HEALTHY_MIN * m2, max: BMI_HEALTHY_MAX * m2 };
};

/**
 * Devine reference weight, which differs by sex. Only defined for the two sexes the formula was built for and for
 * heights over 5 ft; for anyone else the screen shows just the BMI range.
 */
export const devineWeight = (heightCm: number, gender: 'M' | 'F' | 'O' | null): number | null => {
  if ((gender !== 'M' && gender !== 'F') || heightCm < 152.4) return null;
  const inchesOver5ft = heightCm / 2.54 - 60;
  return (gender === 'M' ? 50 : 45.5) + 2.3 * inchesOver5ft;
};
