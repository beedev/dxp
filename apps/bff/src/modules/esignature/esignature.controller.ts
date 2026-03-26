import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ESignaturePort, SignatureRequest } from './ports/esignature.port';

@ApiTags('esignature')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('esignature')
export class ESignatureController {
  constructor(private readonly esign: ESignaturePort) {}

  @Post('envelopes')
  @ApiOperation({ summary: 'Create signing envelope' })
  create(@Body() dto: SignatureRequest) { return this.esign.createEnvelope(dto); }

  @Get('envelopes')
  @ApiOperation({ summary: 'List envelopes' })
  list(@Query('status') status?: string) { return this.esign.listEnvelopes(status); }

  @Get('envelopes/:id')
  @ApiOperation({ summary: 'Get envelope status' })
  get(@Param('id') id: string) { return this.esign.getEnvelope(id); }

  @Post('envelopes/:id/signing-url')
  @ApiOperation({ summary: 'Get signing URL for a signer' })
  signingUrl(@Param('id') id: string, @Body('email') email: string) { return this.esign.getSigningUrl(id, email); }
}
