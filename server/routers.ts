import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createAppUser, getAppUserByEmail, getAppUserById, updateAppUser, updateLastSignIn, activatePremium, getActiveSubscription } from "./db";
import * as crypto from "crypto";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Autenticação customizada com email/senha
  appAuth: router({
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
        })
      )
      .mutation(async ({ input }) => {
        // Verificar se email já existe
        const existingUser = await getAppUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Este email já está cadastrado");
        }

        // Hash da senha
        const passwordHash = crypto.createHash('sha256').update(input.password).digest('hex');

        // Criar usuário
        const user = await createAppUser({
          email: input.email,
          passwordHash,
          name: input.name,
        });

        if (!user) {
          throw new Error("Erro ao criar usuário");
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhotoUrl: user.profilePhotoUrl,
            isPremium: user.isPremium === 1,
            premiumType: user.premiumType,
            premiumExpiresAt: user.premiumExpiresAt,
          },
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const user = await getAppUserByEmail(input.email);
        if (!user) {
          throw new Error("Email ou senha incorretos");
        }

        const passwordHash = crypto.createHash('sha256').update(input.password).digest('hex');
        if (user.passwordHash !== passwordHash) {
          throw new Error("Email ou senha incorretos");
        }

        // Atualizar último login
        await updateLastSignIn(user.id);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhotoUrl: user.profilePhotoUrl,
            isPremium: user.isPremium === 1,
            premiumType: user.premiumType,
            premiumExpiresAt: user.premiumExpiresAt,
          },
        };
      }),

    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getAppUserById(input.userId);
        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhotoUrl: user.profilePhotoUrl,
          isPremium: user.isPremium === 1,
          premiumType: user.premiumType,
          premiumExpiresAt: user.premiumExpiresAt,
          createdAt: user.createdAt,
        };
      }),

    updateProfile: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().optional(),
          profilePhotoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, ...data } = input;
        await updateAppUser(userId, data);
        return { success: true };
      }),

    subscribePremium: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          type: z.enum(["monthly", "yearly"]),
        })
      )
      .mutation(async ({ input }) => {
        await activatePremium(input.userId, input.type);
        return { success: true };
      }),

    checkPremium: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const subscription = await getActiveSubscription(input.userId);
        const user = await getAppUserById(input.userId);
        
        return {
          isPremium: user?.isPremium === 1 && subscription !== null,
          subscription: subscription ? {
            type: subscription.type,
            expiresAt: subscription.expiresAt,
            status: subscription.status,
          } : null,
        };
      }),
  }),

  // AI-powered features
  ai: router({
    processVoiceTask: publicProcedure
      .input(
        z.object({
          audioUrl: z.string().url(),
          language: z.string().optional().default("pt"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { transcribeAudio } = await import("./_core/voiceTranscription");

        try {
          const transcription = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: input.language || "pt",
            prompt: "Transcrever em português brasileiro a tarefa ou lembrete que o usuário está falando",
          });

          if ('error' in transcription) {
            throw new Error(transcription.error);
          }

          if (!transcription.text) {
            throw new Error("N\u00e3o foi poss\u00edvel transcrever o \u00e1udio");
          }

          // Log da transcri\u00e7\u00e3o para debug
          console.log("[DEBUG] Transcri\u00e7\u00e3o Whisper:", transcription.text);
          console.log("[DEBUG] Idioma detectado:", transcription.language);

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um assistente brasileiro que extrai informações de tarefas de texto em português.
Extraia o título e descrição da tarefa.
O título deve ser curto e objetivo.
A descrição deve conter detalhes adicionais, se houver.
Se não houver descrição, deixe vazio.
Responda SEMPRE em português brasileiro.
Formato JSON: {"title": "...", "description": "..."}`,
              },
              {
                role: "user",
                content: `Extraia as informações desta tarefa falada em português: "${transcription.text}"`,
              },
            ],
            response_format: {
              type: "json_object",
            },
          });

          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          const taskData = JSON.parse(content);

          // Log do resultado da IA
          console.log("[DEBUG] Resposta da IA:", content);

          return {
            success: true,
            transcription: transcription.text,
            task: {
              title: taskData.title || taskData.titulo || transcription.text,
              description: taskData.description || taskData.descricao || "",
            },
          };
        } catch (error) {
          console.error("Error processing voice task:", error);
          throw new Error("Erro ao processar \u00e1udio");
        }
      }),

    processTextTask: publicProcedure
      .input(
        z.object({
          text: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voc\u00ea \u00e9 um assistente brasileiro que extrai informa\u00e7\u00f5es de tarefas de texto em portugu\u00eas.
Extraia o t\u00edtulo e descri\u00e7\u00e3o da tarefa.
O t\u00edtulo deve ser curto e objetivo.
A descri\u00e7\u00e3o deve conter detalhes adicionais, se houver.
Se n\u00e3o houver descri\u00e7\u00e3o, deixe vazio.
Responda SEMPRE em portugu\u00eas brasileiro.
Formato JSON: {"title": "...", "description": "..."}`,
              },
              {
                role: "user",
                content: `Extraia as informa\u00e7\u00f5es desta tarefa: "${input.text}"`,
              },
            ],
            response_format: {
              type: "json_object",
            },
          });

          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          const taskData = JSON.parse(content);

          return {
            success: true,
            task: {
              title: taskData.title || taskData.titulo || input.text,
              description: taskData.description || taskData.descricao || "",
            },
          };
        } catch (error) {
          console.error("Error processing text task:", error);
          throw new Error("Erro ao processar texto");
        }
      }),

    extractExpenseData: publicProcedure
      .input(
        z.object({
          imageUri: z.string(),
          documentType: z.enum(['boleto', 'nota_fiscal', 'recibo', 'comprovante', 'outro']).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { storagePut } = await import("./storage");

        try {
          // Processar arquivo para obter URL pública
          let publicFileUrl: string;
          let isPDF = false;
          
          if (input.imageUri.startsWith('data:')) {
            // Base64 data URI - fazer upload para S3
            const mimeMatch = input.imageUri.match(/^data:([^;]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            isPDF = mimeType === 'application/pdf';
            
            const base64Data = input.imageUri.split(',')[1];
            const fileBuffer = Buffer.from(base64Data, 'base64');
            
            // Determinar extensão do arquivo
            let fileExtension = 'jpg';
            if (isPDF) fileExtension = 'pdf';
            else if (mimeType === 'image/png') fileExtension = 'png';
            else if (mimeType.includes('word') || mimeType.includes('document')) fileExtension = 'docx';
            
            const fileName = `ocr/${Date.now()}.${fileExtension}`;
            const uploadResult = await storagePut(fileName, fileBuffer, mimeType);
            publicFileUrl = uploadResult.url;
            
            console.log(`[OCR] Uploaded file: ${fileName}, MIME: ${mimeType}, URL: ${publicFileUrl}`);
          } else if (input.imageUri.startsWith('http')) {
            // Se já é uma URL pública, usar diretamente
            publicFileUrl = input.imageUri;
            isPDF = input.imageUri.toLowerCase().endsWith('.pdf');
          } else {
            // URI local não suportado - retornar erro claro
            throw new Error('Formato de arquivo não suportado. Use base64 ou URL pública.');
          }

          // Usar LLM multimodal para extrair dados
          const systemPrompt = isPDF 
            ? `Você é um assistente especializado em extrair dados de documentos financeiros brasileiros em formato PDF.
Analise o documento PDF e extraia TODAS as informações financeiras que encontrar:
- Valor total (número decimal, ex: 150.00)
- Data do documento ou transação (formato YYYY-MM-DD)
- Descrição do serviço, produto ou transação
- Nome do estabelecimento, empresa ou fornecedor
- Tipo de documento (boleto, nota_fiscal, recibo, fatura, extrato, comprovante, outro)

IMPORTANTE:
- Procure por valores monetários (R$, BRL, etc)
- Identifique a descrição principal do gasto
- Se houver múltiplos valores, extraia o TOTAL
- Seja preciso nos valores numéricos

Retorne APENAS um JSON válido com esta estrutura:
{
  "documentType": "tipo_do_documento",
  "valor": 0.00,
  "data": "YYYY-MM-DD",
  "descricao": "descrição do gasto",
  "estabelecimento": "nome da empresa",
  "confidence": 0.85
}`
            : `Você é um assistente especializado em extrair dados de comprovantes financeiros brasileiros.
Analise a imagem e extraia as seguintes informações:
- Valor (número decimal, ex: 150.00)
- Data (formato YYYY-MM-DD)
- Descrição/item comprado
- Estabelecimento/fornecedor
- Tipo de documento (boleto, nota_fiscal, recibo, comprovante, outro)
- Para boletos: código de barras

Retorne APENAS um JSON válido com esta estrutura:
{
  "documentType": "tipo",
  "valor": 0.00,
  "data": "YYYY-MM-DD",
  "descricao": "texto",
  "estabelecimento": "nome",
  "codigoBarras": "apenas para boletos",
  "confidence": 0.85
}`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: isPDF 
                  ? [
                      {
                        type: "text",
                        text: `Extraia os dados financeiros deste documento PDF. Identifique o valor total, descrição do gasto e estabelecimento.`,
                      },
                      {
                        type: "file_url",
                        file_url: {
                          url: publicFileUrl,
                          mime_type: "application/pdf",
                        },
                      },
                    ]
                  : [
                      {
                        type: "text",
                        text: `Extraia os dados deste comprovante${input.documentType ? ` (tipo: ${input.documentType})` : ""}.`,
                      },
                      {
                        type: "image_url",
                        image_url: {
                          url: publicFileUrl,
                        },
                      },
                    ],
              },
            ],
            response_format: {
              type: "json_object",
            },
          });

          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          
          console.log(`[OCR] Raw LLM response: ${content}`);
          
          let extractedData;
          try {
            extractedData = JSON.parse(content);
          } catch (parseError) {
            console.error(`[OCR] Failed to parse LLM response: ${content}`);
            // Tentar extrair dados manualmente se JSON falhar
            extractedData = {
              documentType: 'outro',
              valor: 0,
              descricao: 'Documento importado',
              confidence: 0.5
            };
          }
          
          console.log(`[OCR] Extracted data:`, extractedData);

          // Montar resultado estruturado
          const result = {
            id: `ocr_${Date.now()}`,
            documentType: extractedData.documentType || input.documentType || 'outro',
            confidence: extractedData.confidence || 0.8,
            rawText: JSON.stringify(extractedData),
            extractedFields: {
              valor: extractedData.valor,
              data: extractedData.data,
              descricao: extractedData.descricao,
              estabelecimento: extractedData.estabelecimento,
              codigoBarras: extractedData.codigoBarras,
              digitoVerificador: extractedData.digitoVerificador,
              dataVencimento: extractedData.dataVencimento,
              beneficiario: extractedData.beneficiario,
            },
            needsReview: extractedData.confidence < 0.7 || !extractedData.valor,
            createdAt: new Date().toISOString(),
          };

          return result;
        } catch (error) {
          console.error("Error extracting expense data:", error);
          throw new Error("Erro ao extrair dados do comprovante");
        }
      }),

    breakDownTask: publicProcedure
      .input(
        z.object({
          taskTitle: z.string(),
          taskDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voc\u00ea \u00e9 um assistente de produtividade especializado em quebrar tarefas complexas em subtarefas acion\u00e1veis.

Analise a tarefa fornecida e quebre-a em 3-8 subtarefas espec\u00edficas e pr\u00e1ticas.
Cada subtarefa deve ser:
- Acion\u00e1vel (come\u00e7a com um verbo)
- Espec\u00edfica (clara e sem ambiguidade)
- Realista (pode ser conclu\u00edda em uma sess\u00e3o de trabalho)

Responda APENAS com um objeto JSON contendo um array 'subtasks' de strings, sem explica\u00e7\u00f5es adicionais.
Exemplo: {"subtasks": ["Pesquisar op\u00e7\u00f5es de fornecedores", "Comparar pre\u00e7os e qualidade", "Solicitar or\u00e7amentos"]}`,
              },
              {
                role: "user",
                content: `Tarefa: ${input.taskTitle}${input.taskDescription ? `\nDescri\u00e7\u00e3o: ${input.taskDescription}` : ""}`,
              },
            ],
            response_format: {
              type: "json_object",
            },
          });

          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          const result = JSON.parse(content);
          
          let subtasks: string[] = [];
          if (Array.isArray(result)) {
            subtasks = result;
          } else if (result.subtasks && Array.isArray(result.subtasks)) {
            subtasks = result.subtasks;
          } else if (result.tarefas && Array.isArray(result.tarefas)) {
            subtasks = result.tarefas;
          } else {
            const values = Object.values(result);
            const firstArray = values.find(v => Array.isArray(v));
            if (firstArray && Array.isArray(firstArray)) {
              subtasks = firstArray as string[];
            }
          }

          if (subtasks.length === 0) {
            throw new Error("Nenhuma subtarefa foi gerada");
          }

          return {
            success: true,
            subtasks: subtasks.map((title: string) => ({
              title: title.trim(),
              completed: false,
            })),
          };
        } catch (error) {
          console.error("Error breaking down task:", error);
          throw new Error("Erro ao quebrar tarefa em subtarefas");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
