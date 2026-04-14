# Project TODO

## Core Features
- [x] Estrutura de dados para tarefas (Task model)
- [x] Armazenamento local com AsyncStorage
- [x] Tela principal com lista de tarefas
- [x] Estado vazio quando não há tarefas
- [x] Botão FAB para adicionar nova tarefa
- [x] Tela de adicionar/editar tarefa
- [x] Criar nova tarefa
- [x] Editar tarefa existente
- [x] Marcar/desmarcar tarefa como concluída
- [x] Deletar tarefa com swipe
- [x] Validação de formulário

## UI/UX
- [x] Design system com cores personalizadas
- [x] Suporte a modo claro e escuro
- [x] Ícone customizado do app
- [x] Animações de transição suaves
- [x] Feedback háptico em ações principais
- [x] Estados de press em botões e cards
- [x] Layout responsivo

## Polish
- [x] Testes de funcionalidade
- [x] Otimização de performance
- [x] Tratamento de erros

## Melhorias Profissionais
- [x] Gerenciamento de estado global com Context API
- [x] Sistema de notificações toast
- [x] Error boundaries para captura de erros
- [x] Documentação JSDoc completa
- [x] Melhor tratamento de erros com retry logic

## Página de Perfil
- [x] Estrutura de dados para perfil do usuário
- [x] Tela de perfil com foto e informações
- [x] Estatísticas (tarefas concluídas, projetos, metas)
- [x] Tela de edição de perfil
- [x] Seção de preferências e configurações
- [x] Integração na navegação (tab bar)

## Upload de Foto de Perfil
- [x] Instalar expo-image-picker
- [x] Adicionar seleção de foto na edição de perfil
- [x] Exibir foto personalizada no perfil

## Funcionalidades de IA
- [x] API endpoint para processamento de voz
- [x] API endpoint para assistente de tarefas
- [x] Entrada de tarefas por voz
- [x] Assistente IA para quebrar tarefas complexas
- [x] Integração na UI do formulário

## Correções de Bugs
- [x] Corrigir upload de áudio para S3 no VoiceRecorder
- [x] Testar funcionalidade de voz após correção

## Correção Endpoint Upload
- [x] Criar endpoint /api/upload no servidor
- [ ] Testar upload de áudio funcionando

## Correção URL Upload
- [x] Usar URL completa do servidor no VoiceRecorder
- [ ] Testar upload funcionando

## Correção Idioma Transcrição
- [x] Configurar português brasileiro na transcrição de áudio
- [ ] Testar transcrição em português

## Debug Transcrição
- [x] Adicionar logs para ver texto transcrito
- [x] Melhorar configurações do Whisper
- [x] Retornar transcrição original para o usuário ver

## Melhorias Transcrição
- [x] Adicionar tela de confirmação mostrando texto transcrito
- [x] Permitir edição manual da transcrição
- [x] Botão para regravar se transcrição estiver errada

## Correção Profunda Upload Áudio
- [x] Simplificar fluxo de upload
- [x] Melhorar tratamento de erros
- [x] Adicionar logs detalhados
- [ ] Testar em dispositivo real

## Correção React Hooks
- [x] Mover useMutation para topo do componente
- [ ] Testar funcionalidade corrigida

## Sistema de Datas de Vencimento
- [x] Adicionar campo dueDate ao modelo Task
- [x] Implementar date/time picker no formulário
- [x] Indicador visual de tarefas atrasadas (vermelho)
- [x] Indicador de tarefas vencendo hoje (amarelo)
- [x] Ordenação por data de vencimento
- [x] Configurar expo-notifications
- [x] Agendar notificações push
- [x] Filtros: Todas, Hoje, Atrasadas, Próximas, Sem data
- [x] Badge com contador de tarefas atrasadas

## Aba Gastos das Tarefas
- [x] Modelo de dados para gastos (Expense)
- [x] Serviço de armazenamento com AsyncStorage
- [x] Context API para gerenciamento de gastos
- [x] Tela principal com lista de gastos
- [x] Formulário de adicionar/editar gasto
- [x] Campo de valor com suporte a múltiplas moedas
- [x] Categorização: Pessoal, Coletivo, Institucional
- [x] Gráfico de pizza por categoria
- [x] Resumo visual de gastos totais
- [x] Recursos de acessibilidade (contraste, botões grandes)
- [x] Linguagem simples e inclusiva
- [x] Integração na navegação (tab bar)
- [x] Ícone da aba de gastos

## Compatibilidade Android
- [x] Verificar layouts em diferentes tamanhos de tela (celular, tablet)
- [x] Ajustar SafeArea para Android (edge-to-edge)
- [x] Testar gestos nativos Android (back button, swipe)
- [x] Validar teclado virtual e inputs)
- [ ] Testar notificações push no Android
- [x] Verificar performance e animações
- [x] Testar navegação entre abas
- [x] Validar formulários e date picker

## Módulos de IA

### Fase 1
- [x] OCR Universal - Estrutura de dados
- [x] OCR Universal - Serviço de extração com IA
- [x] OCR Universal - Interface de captura de foto/PDF
- [x] OCR Universal - Tela de revisão manual
- [x] Valor Fixo Inteligente - Modelo de dados
- [x] Valor Fixo Inteligente - Cálculo de média diária
- [x] Valor Fixo Inteligente - Recomendações proativas

### Fase 2 - Assistente Proativo
- [x] Criar aba "Assistente Proativo"
- [x] Guardar o Troco - Lógica de arredondamento
- [x] Guardar o Troco - Visualização de economia
- [x] Meta de Economia - Sugestão baseada em renda/gastos
- [x] Meta de Economia - Acompanhamento de progresso
- [x] Caçador de Assinaturas - Detecção de gastos recorrentes
- [x] Caçador de Assinaturas - Alertas de renovação

### Fase 3
- [x] Análise Preditiva - Detecção de padrões
- [x] Análise Preditiva - Geração de sugestões- [x] Análise Preditiva - Interface de aceitar/rejeitarção

## Correção OCR no Formulário
- [x] Adicionar botão "Capturar Comprovante" no formulário de gastos
- [x] Integrar componente OCR-capture ao expense-form
- [x] Preencher campos automaticamente após OCR

## Correção Erro OCR
- [x] Diagnosticar erro "Erro ao extrair dados do comprovante"
- [x] Corrigir serviço de extração OCR
- [x] Testar extração funcionando

## Correção Layout Gastos
- [x] Fazer Distribuição por Categoria rolar junto com a lista de gastos

## Correção Layout Gastos
- [x] Fazer Distribuição por Categoria rolar junto com a lista de gastos

## Importar Comprovantes PDF/Documentos
- [x] Adicionar botão "Importar Documento" no OCR capture
- [x] Suportar seleção de PDF e outros documentos
- [x] Processar documentos com OCR

## Correção Extração PDF
- [x] Corrigir extração de descrição e valor de PDF/documentos
- [x] Testar extração funcionando corretamente

## Correção PDF - Conversão para Imagem
- [x] Usar file_url com mime_type para PDFs
- [x] Testar extração de PDF funcionando

## Sistema de Autenticação e Melhorias
- [x] Tela de cadastro com email/senha
- [x] Tela de login
- [x] Armazenamento de usuários no banco de dados
- [x] Foto de perfil no canto superior direito da aba Tarefas
- [x] Aba Assistente Premium (R$ 9,99/mês ou R$ 110/ano)
- [x] Paywall para bloquear acesso sem assinatura
- [x] Estatísticas clicáveis na aba Perfil (mostrar detalhes ao clicar)
- [x] KeyboardAvoidingView na aba Assistente

## Correção Sincronização Foto de Perfil
- [x] Sincronizar foto de perfil entre aba Perfil e aba Tarefas

## Correções Aba Perfil e Login
- [x] Adicionar botão "Sair da conta" na aba Perfil
- [x] Adicionar logo do app nas telas de login e cadastro
- [x] Corrigir estatísticas clicáveis na aba Perfil

## Correção Crash Data de Vencimento
- [x] Corrigir crash ao selecionar data de vencimento em novas tarefas (Android: separar date e time picker)
- [x] Verificar lógica de login para usuários cadastrados (já implementado corretamente)

## Correção Tema Claro
- [x] Corrigir tema claro não funcionando nas configurações do app (integrado com ThemeProvider)

## Sistema de Pagamento e Plano Premium
- [x] Criar tela de planos (gratuito vs premium)
- [x] Implementar sistema de pagamento simulado
- [x] Vincular conta para autenticação de pagamento
- [x] Liberar plano premium após pagamento
- [x] Bloquear acesso se não pagar (paywall na aba Assistente)
- [x] Corrigir teclado seguindo campos no cadastro (KeyboardAvoidingView + ScrollView)

## Correção Teclado Aba Assistente
- [x] Corrigir teclado na aba Assistente para seguir os campos de input no Android (APK)

## Gastos Gerais e Toque Duplo
- [x] Remover Caçador de Assinaturas da aba Assistente
- [x] Adicionar seção Gastos Gerais com valor mensal recebido e cálculo automático
- [x] Implementar toque duplo para sair do app (Android back button)
