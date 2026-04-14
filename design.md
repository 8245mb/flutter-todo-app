# Design do Aplicativo To-Do List

## Visão Geral

O aplicativo To-Do List é um gerenciador de tarefas moderno e intuitivo que permite aos usuários criar, visualizar, editar e excluir tarefas. O design segue os princípios do Apple Human Interface Guidelines (HIG) para proporcionar uma experiência nativa e familiar em dispositivos iOS, com orientação portrait (9:16) otimizada para uso com uma mão.

## Lista de Telas

### 1. Tela Principal (Home)
**Propósito:** Exibir todas as tarefas do usuário em uma lista rolável.

**Conteúdo:**
- Título do app no topo
- Lista de tarefas com scroll vertical
- Botão flutuante de adicionar tarefa (FAB) no canto inferior direito
- Indicador visual de tarefas concluídas vs pendentes
- Estado vazio quando não há tarefas

**Funcionalidades:**
- Visualizar todas as tarefas
- Marcar/desmarcar tarefas como concluídas com tap
- Deslizar para deletar tarefa (swipe to delete)
- Tap na tarefa para editar
- Adicionar nova tarefa via FAB

### 2. Tela de Adicionar/Editar Tarefa
**Propósito:** Criar nova tarefa ou editar tarefa existente.

**Conteúdo:**
- Campo de texto para título da tarefa
- Campo de texto para descrição (opcional)
- Botões de ação: Salvar e Cancelar

**Funcionalidades:**
- Validação de campos obrigatórios
- Salvar tarefa localmente
- Cancelar e voltar para tela principal

## Fluxos de Usuário Principais

### Fluxo 1: Adicionar Nova Tarefa
1. Usuário toca no botão FAB (+) na tela principal
2. Abre tela de adicionar tarefa
3. Usuário preenche título (obrigatório) e descrição (opcional)
4. Usuário toca em "Salvar"
5. Tarefa é salva localmente (AsyncStorage)
6. Retorna para tela principal com a nova tarefa na lista

### Fluxo 2: Marcar Tarefa como Concluída
1. Usuário toca no checkbox/círculo ao lado da tarefa
2. Tarefa muda visualmente (texto riscado, opacidade reduzida)
3. Estado é salvo localmente
4. Feedback háptico leve confirma a ação

### Fluxo 3: Editar Tarefa
1. Usuário toca na tarefa na lista
2. Abre tela de edição com dados preenchidos
3. Usuário modifica título ou descrição
4. Usuário toca em "Salvar"
5. Tarefa é atualizada localmente
6. Retorna para tela principal com tarefa atualizada

### Fluxo 4: Deletar Tarefa
1. Usuário desliza a tarefa para a esquerda (swipe left)
2. Aparece botão vermelho de deletar
3. Usuário confirma deslizando completamente ou tocando no botão
4. Tarefa é removida da lista e do armazenamento local
5. Feedback háptico médio confirma a ação

## Escolhas de Cores

**Paleta Principal:**
- **Primary (Azul):** `#0a7ea4` - Cor de destaque para botões principais e elementos interativos
- **Background (Claro):** `#ffffff` - Fundo principal do app no modo claro
- **Background (Escuro):** `#151718` - Fundo principal do app no modo escuro
- **Surface (Claro):** `#f5f5f5` - Cards e superfícies elevadas no modo claro
- **Surface (Escuro):** `#1e2022` - Cards e superfícies elevadas no modo escuro
- **Foreground (Claro):** `#11181C` - Texto principal no modo claro
- **Foreground (Escuro):** `#ECEDEE` - Texto principal no modo escuro
- **Success (Verde):** `#22C55E` - Indicador de tarefas concluídas
- **Error (Vermelho):** `#EF4444` - Botão de deletar e estados de erro

**Aplicação das Cores:**
- Botão FAB: Primary com ícone branco
- Tarefas pendentes: Foreground sobre Surface
- Tarefas concluídas: Success com opacidade reduzida e texto riscado
- Botão deletar: Error
- Checkboxes: Primary quando marcado, Border quando desmarcado

## Componentes de Interface

### Card de Tarefa
- Container com fundo Surface
- Borda arredondada (12px)
- Sombra sutil para elevação
- Padding interno consistente (16px)
- Layout horizontal: Checkbox | Conteúdo | Ícone de edição

### Botão Flutuante (FAB)
- Círculo com ícone de "+"
- Cor Primary
- Sombra pronunciada
- Posicionado no canto inferior direito
- Feedback de escala ao pressionar (0.95)

### Campos de Texto
- Borda arredondada
- Cor Border no estado normal
- Cor Primary quando focado
- Placeholder com cor Muted
- Padding interno adequado para toque

### Botões de Ação
- Primário: Fundo Primary, texto branco
- Secundário: Fundo transparente, borda Border, texto Foreground
- Altura mínima de 48px para acessibilidade
- Bordas arredondadas (8px)

## Princípios de Design

1. **Simplicidade:** Interface limpa sem elementos desnecessários
2. **Feedback Visual:** Todas as ações têm resposta visual imediata
3. **Acessibilidade:** Áreas de toque de no mínimo 44x44pt
4. **Consistência:** Mesmos padrões de interação em todo o app
5. **Responsividade:** Adaptação suave a diferentes tamanhos de tela
6. **Modo Escuro:** Suporte completo com transição automática

## Interações e Animações

- **Tap em tarefa:** Opacidade 0.7 durante o toque
- **Marcar como concluída:** Animação de fade + riscado do texto (250ms)
- **Adicionar tarefa:** Slide up da tela de formulário (300ms)
- **Deletar tarefa:** Swipe com feedback visual e animação de saída (200ms)
- **FAB:** Scale down para 0.95 ao pressionar com haptic feedback leve
- **Salvar:** Haptic feedback médio ao confirmar ação

## Armazenamento Local

- **Tecnologia:** AsyncStorage (React Native)
- **Estrutura de dados:**
  - `id`: string única (timestamp + random)
  - `title`: string (obrigatório)
  - `description`: string (opcional)
  - `completed`: boolean
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

## Observações Técnicas

- Não requer autenticação de usuário
- Não requer sincronização em nuvem
- Todas as operações são locais e offline-first
- Dados persistem entre sessões do app
- Suporte a modo claro e escuro automático baseado no sistema
