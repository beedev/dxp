// @dxp/ai-assistant — Conversational AI Assistant for any DXP portal
//
// Usage:
//   import {
//     AgenticAssistant,    // Customer-facing chat component
//     AgenticPlayground,   // Combined demo (chat + configs + readiness + builder)
//     AgentReadiness,      // Data quality dashboard
//     ConfigBuilder,       // LLM-powered persona generator
//     DataPipeline,        // Data ingestion + graph enrichment manager
//     useAgentChat,        // WebSocket state hook
//   } from '@dxp/ai-assistant';

// === Components ===
export { AgenticAssistant } from './components/AgenticAssistant';
export { MessageBubble } from './components/MessageBubble';
export { EntityCard, EntityGrid, ProductCard, ProductGrid } from './components/ProductCard';
export { AgentStepCard } from './components/AgentStepCard';
export { UserSelector } from './components/UserSelector';
export { PreferencesPanel } from './components/PreferencesPanel';
export { UploadButton, UploadChips } from './components/UploadButton';
export { MicButton } from './components/MicButton';
export { SpeakButton } from './components/SpeakButton';

// === Pages (drop into any portal's manager/customer view) ===
export { AgenticPlayground } from './pages/AgenticPlayground';
export { AgentReadiness } from './pages/AgentReadiness';
export { ConfigBuilder } from './pages/ConfigBuilder';
export { DataPipeline } from './pages/DataPipeline';

// === Hook ===
export { useAgentChat } from './hooks/useAgentChat';

// === Types ===
export type {
  ActionFormField,
  AgentEntity,
  AgentProduct,
  AgentStep,
  AgentStepType,
  AgentUIConfig,
  CartItem,
  ChatMessage,
  ChatRole,
  DemoUser,
  EntityAction,
  EntityCardLayout,
  EntityConfig,
  UploadRecord,
} from './lib/agent-types';
