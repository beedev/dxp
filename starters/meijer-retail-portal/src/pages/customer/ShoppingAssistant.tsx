/**
 * ShoppingAssistant — Ace Hardware's integration of the reusable
 * <AgenticAssistant /> component.
 *
 * The AgenticAssistant is domain-agnostic: it loads its title, suggestions,
 * and persona from the backend's `/api/agent-config` endpoint (which reads
 * the deployment's persona JSON config). This wrapper exists only as the
 * portal-route entry point — if Ace needs Ace-specific behavior here
 * (e.g., special integration with their cart page), it would go in this file.
 */

import React from 'react';
import { AgenticAssistant } from '@dxp/ai-assistant';

export function ShoppingAssistant() {
  return <AgenticAssistant />;
}
