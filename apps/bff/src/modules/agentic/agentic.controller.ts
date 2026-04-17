import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgenticPort } from './ports/agentic.port';

@ApiTags('agentic')
@Controller('agentic')
export class AgenticController {
  constructor(private readonly agentic: AgenticPort) {}

  @Get('configs')
  @ApiOperation({
    summary: 'List available agentic deployment configs (retail, insurance, etc.)',
  })
  async listConfigs() {
    const configs = await this.agentic.listConfigs();
    return { configs };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get active deployment UI config (title, suggestions)' })
  getConfig() {
    return this.agentic.getUIConfig();
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Agent Readiness Monitor — scores catalog/data quality for agentic commerce',
  })
  getReadiness() {
    return this.agentic.getReadiness();
  }

  @Get('users/:userId/preferences')
  @ApiOperation({ summary: 'Get a user\'s stored preferences' })
  getUserPreferences(@Param('userId') userId: string) {
    return this.agentic.getUserPreferences(userId);
  }

  @Get('chat-url')
  @ApiOperation({ summary: 'Get WebSocket URL for the agent chat stream' })
  getChatUrl(@Query('session_id') sessionId: string) {
    return { url: this.agentic.getChatWebSocketUrl(sessionId) };
  }
}
