import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DxpContext } from '../../common/decorators/dxp-context.decorator';
import { DxpRequestContext } from '../../common/interceptors/request-context.interceptor';
import { AuditPort } from './ports/audit.port';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditPort) {}

  @Get()
  @ApiOperation({ summary: 'Query audit log' })
  query(
    @DxpContext() ctx: DxpRequestContext,
    @Query('action') action?: string, @Query('resourceType') resourceType?: string,
    @Query('from') from?: string, @Query('to') to?: string,
    @Query('page') page?: string, @Query('pageSize') pageSize?: string,
  ) {
    return this.audit.query({ tenantId: ctx.tenantId, action, resourceType, from, to, page: page ? parseInt(page) : 1, pageSize: pageSize ? parseInt(pageSize) : 50 });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit entry' })
  get(@Param('id') id: string) { return this.audit.getEntry(id); }

  @Post('report')
  @ApiOperation({ summary: 'Generate compliance report' })
  report(@DxpContext() ctx: DxpRequestContext, @Body() body: { type: 'access' | 'changes' | 'logins'; from: string; to: string }) {
    return this.audit.generateReport(body.type, body.from, body.to, ctx.tenantId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit entries' })
  export(@DxpContext() ctx: DxpRequestContext, @Query('format') format: 'json' | 'csv' = 'json', @Query('from') from?: string, @Query('to') to?: string) {
    return this.audit.exportEntries({ tenantId: ctx.tenantId, from, to }, format);
  }
}
