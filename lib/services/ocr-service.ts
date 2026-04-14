/**
 * Serviço de OCR Universal
 * Extrai dados de comprovantes usando IA multimodal do servidor
 */

import type { OCRExtractedData, DocumentType } from '@/lib/types/ai-modules';

/**
 * Hook para usar o serviço de OCR
 * Deve ser usado dentro de componentes React
 * 
 * Exemplo:
 * ```tsx
 * const extractMutation = useOCRExtraction();
 * 
 * const handleExtract = async (imageUri: string) => {
 *   const result = await extractMutation.mutateAsync({ imageUri });
 *   // usar result...
 * };
 * ```
 */
export { trpc } from '@/lib/trpc';

export class OCRService {

  /**
   * Valida dados extraídos aplicando regras de negócio
   * @param data Dados extraídos
   * @returns true se válido, false caso contrário
   */
  static validateExtractedData(data: OCRExtractedData): boolean {
    const { extractedFields, confidence } = data;

    // Validação básica: deve ter pelo menos valor
    if (!extractedFields.valor || extractedFields.valor <= 0) {
      return false;
    }

    // Se for boleto, validar dígito verificador
    if (data.documentType === 'boleto' && extractedFields.codigoBarras) {
      if (!this.validateBoletoDigit(extractedFields.codigoBarras)) {
        return false;
      }
    }

    // Baixa confiança requer revisão
    if (confidence < 0.7) {
      return false;
    }

    return true;
  }

  /**
   * Valida dígito verificador de boleto
   * @param barcode Código de barras do boleto
   * @returns true se válido
   */
  private static validateBoletoDigit(barcode: string): boolean {
    // Remove espaços e caracteres não numéricos
    const cleanBarcode = barcode.replace(/\D/g, '');

    // Boleto deve ter 47 dígitos
    if (cleanBarcode.length !== 47) {
      return false;
    }

    // Algoritmo módulo 10 para validação
    // Simplificado - em produção usar biblioteca especializada
    const checkDigit = cleanBarcode[4];
    const calculatedDigit = this.calculateBoletoCheckDigit(cleanBarcode);

    return checkDigit === calculatedDigit;
  }

  /**
   * Calcula dígito verificador de boleto (módulo 10)
   */
  private static calculateBoletoCheckDigit(barcode: string): string {
    // Implementação simplificada do módulo 10
    // Em produção, usar biblioteca como 'boleto-utils'
    const digits = barcode.slice(0, 4) + barcode.slice(5);
    let sum = 0;
    let multiplier = 2;

    for (let i = digits.length - 1; i >= 0; i--) {
      const digit = parseInt(digits[i], 10);
      const product = digit * multiplier;
      sum += product > 9 ? product - 9 : product;
      multiplier = multiplier === 2 ? 1 : 2;
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return checkDigit.toString();
  }

  /**
   * Detecta tipo de documento automaticamente
   * @param rawText Texto extraído da imagem
   * @returns Tipo de documento detectado
   */
  static detectDocumentType(rawText: string): DocumentType {
    const lowerText = rawText.toLowerCase();

    if (lowerText.includes('código de barras') || lowerText.includes('boleto')) {
      return 'boleto';
    }

    if (lowerText.includes('nota fiscal') || lowerText.includes('nf-e')) {
      return 'nota_fiscal';
    }

    if (lowerText.includes('recibo') || lowerText.includes('comprovante de pagamento')) {
      return 'recibo';
    }

    if (lowerText.includes('comprovante')) {
      return 'comprovante';
    }

    return 'outro';
  }

  /**
   * Sugere categoria baseada no estabelecimento/descrição
   * @param estabelecimento Nome do estabelecimento
   * @param descricao Descrição do gasto
   * @returns Categoria sugerida
   */
  static suggestCategory(
    estabelecimento?: string,
    descricao?: string
  ): 'pessoal' | 'coletivo' | 'institucional' {
    const text = `${estabelecimento || ''} ${descricao || ''}`.toLowerCase();

    // Palavras-chave para institucional
    const institucionalKeywords = ['empresa', 'ltda', 'sa', 'mei', 'cnpj', 'fornecedor'];
    if (institucionalKeywords.some((keyword) => text.includes(keyword))) {
      return 'institucional';
    }

    // Palavras-chave para coletivo
    const coletivoKeywords = ['família', 'grupo', 'condomínio', 'compartilhado'];
    if (coletivoKeywords.some((keyword) => text.includes(keyword))) {
      return 'coletivo';
    }

    // Padrão: pessoal
    return 'pessoal';
  }
}
