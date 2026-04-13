import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoyaltyPort, EarnPointsDto, RedeemPointsDto } from './ports/loyalty.port';

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyPort) {}

  @Get('members/:id')
  @ApiOperation({ summary: 'Get loyalty member by ID' })
  getMember(@Param('id') id: string) {
    return this.loyalty.getMember(id);
  }

  @Get('members/:id/points')
  @ApiOperation({ summary: 'Get points balance for a member' })
  getPointsBalance(@Param('id') id: string) {
    return this.loyalty.getPointsBalance(id);
  }

  @Get('members/:id/transactions')
  @ApiOperation({ summary: 'Get transaction history for a member' })
  getTransactionHistory(@Param('id') id: string) {
    return this.loyalty.getTransactionHistory(id);
  }

  @Post('members/:id/earn')
  @ApiOperation({ summary: 'Earn points for a member' })
  earnPoints(@Param('id') id: string, @Body() dto: EarnPointsDto) {
    return this.loyalty.earnPoints(id, dto.points, dto.description, dto.orderId);
  }

  @Post('members/:id/redeem')
  @ApiOperation({ summary: 'Redeem points for a reward' })
  redeemPoints(@Param('id') id: string, @Body() dto: RedeemPointsDto) {
    return this.loyalty.redeemPoints(id, dto.rewardId);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get rewards catalog' })
  getRewardsCatalog() {
    return this.loyalty.getRewardsCatalog();
  }

  @Get('members/:id/tier')
  @ApiOperation({ summary: 'Get tier status for a member' })
  getTierStatus(@Param('id') id: string) {
    return this.loyalty.getTierStatus(id);
  }
}
