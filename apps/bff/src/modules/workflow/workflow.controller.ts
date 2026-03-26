import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkflowPort, TriggerWorkflowDto } from './ports/workflow.port';

@ApiTags('workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflow: WorkflowPort) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger a workflow' })
  trigger(@Body() dto: TriggerWorkflowDto) { return this.workflow.triggerWorkflow(dto); }

  @Get('executions')
  @ApiOperation({ summary: 'List executions' })
  executions(@Query('workflowId') workflowId?: string, @Query('status') status?: string) { return this.workflow.listExecutions(workflowId, status); }

  @Get('executions/:id')
  @ApiOperation({ summary: 'Get execution' })
  execution(@Param('id') id: string) { return this.workflow.getExecution(id); }

  @Get('definitions')
  @ApiOperation({ summary: 'List workflow definitions' })
  definitions(@Query('active') active?: string) { return this.workflow.listWorkflows(active === 'true' ? true : active === 'false' ? false : undefined); }

  @Post('definitions/:id/activate')
  @ApiOperation({ summary: 'Activate workflow' })
  activate(@Param('id') id: string) { return this.workflow.activateWorkflow(id); }

  @Post('definitions/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate workflow' })
  deactivate(@Param('id') id: string) { return this.workflow.deactivateWorkflow(id); }
}
