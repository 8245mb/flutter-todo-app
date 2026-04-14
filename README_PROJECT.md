# Minhas Tarefas - Aplicativo To-Do List

Um aplicativo moderno e intuitivo de gerenciamento de tarefas desenvolvido em React Native com Expo, baseado no projeto do livro **Flutter Mastery**.

## 📋 Sobre o Projeto

Este aplicativo foi desenvolvido como uma implementação do **Projeto 1: To-Do List App** do livro "Flutter Mastery: The Ultimate Guide from Beginner to Expert". Embora o livro apresente o projeto em Flutter/Dart, esta versão foi adaptada para **React Native/TypeScript** mantendo todos os conceitos e funcionalidades originais.

## ✨ Funcionalidades

- ✅ **CRUD Completo**: Criar, ler, atualizar e deletar tarefas
- 💾 **Armazenamento Local**: Persistência de dados com AsyncStorage
- ✔️ **Marcar como Concluída**: Toggle de status de conclusão
- 🎨 **Design Moderno**: Interface limpa seguindo Apple Human Interface Guidelines
- 🌓 **Modo Claro/Escuro**: Suporte automático baseado no sistema
- 📱 **Responsivo**: Otimizado para diferentes tamanhos de tela
- 🎯 **Feedback Háptico**: Resposta tátil em ações importantes
- 🔔 **Notificações Toast**: Feedback visual para todas as ações
- 🛡️ **Error Boundaries**: Tratamento robusto de erros

## 🏗️ Arquitetura

### Estrutura de Pastas

```
app/
├── (tabs)/
│   └── index.tsx          # Tela principal com lista de tarefas
├── task-form.tsx          # Formulário de adicionar/editar tarefa
└── _layout.tsx            # Layout raiz com providers

components/
├── task-item.tsx          # Componente de item de tarefa
├── empty-state.tsx        # Estado vazio
├── error-boundary.tsx     # Boundary para captura de erros
├── toast.tsx              # Sistema de notificações
└── screen-container.tsx   # Container com SafeArea

lib/
├── contexts/
│   └── task-context.tsx   # Context API para estado global
├── services/
│   └── task-storage.ts    # Serviço de armazenamento
└── types/
    └── task.ts            # Tipos TypeScript

assets/images/
└── icon.png               # Logo customizado do app
```

### Tecnologias Utilizadas

- **React Native 0.81** - Framework mobile multiplataforma
- **Expo SDK 54** - Plataforma de desenvolvimento
- **TypeScript 5.9** - Linguagem tipada
- **React 19** - Biblioteca de UI
- **AsyncStorage** - Armazenamento local
- **NativeWind** - Tailwind CSS para React Native
- **React Native Toast Message** - Sistema de notificações

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- pnpm (gerenciador de pacotes)
- Expo Go app (para testar em dispositivo físico)

### Instalação

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Escanear QR code com Expo Go app
```

### Comandos Disponíveis

```bash
pnpm dev          # Iniciar dev server
pnpm android      # Abrir no emulador Android
pnpm ios          # Abrir no simulador iOS
pnpm check        # Verificar tipos TypeScript
pnpm lint         # Executar linter
pnpm test         # Executar testes
```

## 📦 Modelo de Dados

### Task Interface

```typescript
interface Task {
  id: string;              // ID único
  title: string;           // Título da tarefa (obrigatório)
  description?: string;    // Descrição opcional
  completed: boolean;      // Status de conclusão
  createdAt: number;       // Timestamp de criação
  updatedAt: number;       // Timestamp de última atualização
}
```

## 🎨 Design System

### Paleta de Cores

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `primary` | #6366F1 | #818CF8 | Botões principais, destaques |
| `background` | #ffffff | #0F172A | Fundo da tela |
| `surface` | #F8FAFC | #1E293B | Cards, superfícies elevadas |
| `foreground` | #0F172A | #F1F5F9 | Texto principal |
| `muted` | #64748B | #94A3B8 | Texto secundário |
| `success` | #10B981 | #34D399 | Tarefas concluídas |
| `error` | #EF4444 | #F87171 | Erros, deletar |

### Componentes Reutilizáveis

- **ScreenContainer**: Wrapper com SafeArea
- **TaskItem**: Card de tarefa com ações
- **EmptyState**: Tela vazia com ilustração
- **ErrorBoundary**: Captura de erros global
- **ToastProvider**: Sistema de notificações

## 🔧 Gerenciamento de Estado

O aplicativo utiliza **Context API** para gerenciamento de estado global:

```typescript
const { 
  tasks,           // Lista de tarefas
  isLoading,       // Estado de carregamento
  error,           // Erro atual
  loadTasks,       // Carregar tarefas
  addTask,         // Adicionar tarefa
  updateTask,      // Atualizar tarefa
  deleteTask,      // Deletar tarefa
  toggleTask,      // Toggle conclusão
  clearError       // Limpar erro
} = useTasks();
```

## 🧪 Testes

O projeto inclui estrutura para testes unitários com Vitest. Para adicionar testes:

```typescript
import { describe, it, expect } from 'vitest';

describe('TaskStorage', () => {
  it('should create a task', async () => {
    // Test implementation
  });
});
```

## 📱 Publicação

### Criar Checkpoint

Antes de publicar, crie um checkpoint:

```bash
# Via interface Manus
# Clique em "Save Checkpoint" na UI
```

### Publicar App

1. Crie um checkpoint do estado atual
2. Clique no botão "Publish" no header da UI
3. Siga as instruções para deploy via Expo

## 🤝 Contribuindo

### Boas Práticas

1. **Tipagem**: Sempre use TypeScript com tipos explícitos
2. **Comentários**: Adicione JSDoc em funções públicas
3. **Testes**: Escreva testes para novas funcionalidades
4. **Commits**: Use mensagens descritivas
5. **Code Review**: Revise mudanças antes de merge

### Padrões de Código

- Use `const` e `let`, nunca `var`
- Prefira arrow functions
- Use destructuring quando apropriado
- Mantenha funções pequenas e focadas
- Evite `any`, use tipos específicos

## 📚 Recursos Adicionais

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NativeWind Documentation](https://www.nativewind.dev/)

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais baseado no livro Flutter Mastery.

## 👨‍💻 Autor

Desenvolvido com base no **Projeto 1** do livro "Flutter Mastery: The Ultimate Guide from Beginner to Expert", adaptado para React Native/TypeScript.

---

**Nota**: Este projeto utiliza React Native/Expo ao invés de Flutter/Dart devido às limitações da plataforma de desenvolvimento. Todos os conceitos e funcionalidades do projeto original foram mantidos.
