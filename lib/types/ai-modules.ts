/**
 * Tipos para os módulos de IA do aplicativo
 */

// ============ OCR Universal ============

export type DocumentType = 'boleto' | 'nota_fiscal' | 'recibo' | 'comprovante' | 'outro';

export interface OCRExtractedData {
  id: string;
  documentType: DocumentType;
  confidence: number; // 0-1
  rawText: string;
  extractedFields: {
    valor?: number;
    data?: string;
    descricao?: string;
    estabelecimento?: string;
    categoria?: 'pessoal' | 'coletivo' | 'institucional';
    // Campos específicos de boleto
    codigoBarras?: string;
    digitoVerificador?: string;
    dataVencimento?: string;
    beneficiario?: string;
  };
  needsReview: boolean;
  reviewedAt?: string;
  createdAt: string;
}

// ============ Valor Fixo Inteligente ============

export interface FixedBudget {
  id: string;
  monthlyLimit: number;
  currentSpent: number;
  startDate: string;
  endDate: string;
  dailyAverage: number; // Média diária segura calculada
  daysRemaining: number;
  recommendations: BudgetRecommendation[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRecommendation {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  suggestedDailyLimit: number;
  createdAt: string;
  dismissed: boolean;
}

// ============ Guardar o Troco ============

export interface ChangeRounding {
  id: string;
  originalAmount: number;
  roundedAmount: number;
  savedAmount: number;
  expenseId: string;
  createdAt: string;
}

export interface ChangeSavings {
  totalSaved: number;
  transactionCount: number;
  averageSaving: number;
  monthlyGoal?: number;
}

// ============ Meta de Economia ============

export interface SavingsGoal {
  id: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  suggestedMonthlyContribution: number;
  basedOnIncome?: number;
  basedOnExpenses?: number;
  status: 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// ============ Caçador de Assinaturas ============

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'mensal' | 'anual' | 'semanal';
  nextRenewalDate: string;
  category: 'pessoal' | 'coletivo' | 'institucional';
  detectedExpenseIds: string[];
  confidence: number; // 0-1
  alertEnabled: boolean;
  lastAlertDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAlert {
  id: string;
  recurringExpenseId: string;
  message: string;
  daysUntilRenewal: number;
  dismissed: boolean;
  createdAt: string;
}

// ============ Análise Preditiva ============

export interface ExpensePattern {
  id: string;
  category: 'pessoal' | 'coletivo' | 'institucional';
  pattern: string; // Descrição do padrão detectado
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  confidence: number; // 0-1
  detectedAt: string;
}

export interface PredictiveSuggestion {
  id: string;
  type: 'warning' | 'opportunity' | 'insight';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  relatedPatterns: string[]; // IDs de ExpensePattern
  actionable: boolean;
  actions?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'ignored';
  createdAt: string;
  respondedAt?: string;
}

// ============ Configurações de IA ============

export interface AISettings {
  ocrEnabled: boolean;
  autoExtractData: boolean;
  fixedBudgetEnabled: boolean;
  changeRoundingEnabled: boolean;
  savingsGoalEnabled: boolean;
  subscriptionHunterEnabled: boolean;
  predictiveAnalysisEnabled: boolean;
  notificationsEnabled: boolean;
}
