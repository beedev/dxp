export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'waiting' | 'running' | 'success' | 'error' | 'cancelled';
  startedAt: string;
  finishedAt?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface TriggerWorkflowDto {
  workflowId: string;
  data?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  active: boolean;
  triggerType: 'webhook' | 'schedule' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export abstract class WorkflowPort {
  abstract triggerWorkflow(dto: TriggerWorkflowDto): Promise<WorkflowExecution>;
  abstract getExecution(executionId: string): Promise<WorkflowExecution>;
  abstract listExecutions(workflowId?: string, status?: string): Promise<WorkflowExecution[]>;
  abstract listWorkflows(active?: boolean): Promise<WorkflowDefinition[]>;
  abstract activateWorkflow(workflowId: string): Promise<void>;
  abstract deactivateWorkflow(workflowId: string): Promise<void>;
}
