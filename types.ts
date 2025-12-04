
export enum FunctionType {
  USEFUL = 'Useful',
  HARMFUL = 'Harmful',
}

export enum FunctionGrade {
  NORMAL = 'Normal',
  INSUFFICIENT = 'Insufficient',
  EXCESSIVE = 'Excessive',
}

export interface TrizFunction {
  id: string;
  subject: string;
  action: string;
  object: string;
  type: FunctionType;
  grade: FunctionGrade;
}

export interface AnalysisResult {
  reasoning: string; // New field for Chain of Thought text
  components: string[];
  functions: TrizFunction[];
}

export interface AnalysisState {
  image: string | null; // Base64
  rawComponentList: string;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}

export enum ViewMode {
  SETUP = 'setup',
  MATRIX = 'matrix',
  TABLE = 'table',
  GRAPH = 'graph',
}
