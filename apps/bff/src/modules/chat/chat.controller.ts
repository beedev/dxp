import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { ChatPort, CreateConversationDto } from './ports/chat.port';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatPort) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start a conversation' })
  create(@DxpContext() ctx: DxpRequestContext, @Body() dto: CreateConversationDto) { return this.chat.createConversation(ctx.userId, dto); }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  list(@DxpContext() ctx: DxpRequestContext, @Query('status') status?: string) { return this.chat.listConversations(ctx.userId, status); }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation' })
  get(@Param('id') id: string) { return this.chat.getConversation(id); }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message' })
  send(@Param('id') id: string, @Body('content') content: string) { return this.chat.sendMessage(id, content, 'user'); }

  @Post('conversations/:id/close')
  @ApiOperation({ summary: 'Close conversation' })
  close(@Param('id') id: string) { return this.chat.closeConversation(id); }
}
