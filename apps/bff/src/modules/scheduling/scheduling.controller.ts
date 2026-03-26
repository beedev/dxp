import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchedulingPort, CreateAppointmentDto } from './ports/scheduling.port';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingPort) {}

  @Post('appointments')
  @ApiOperation({ summary: 'Create appointment' })
  create(@Body() dto: CreateAppointmentDto) { return this.scheduling.createAppointment(dto); }

  @Get('appointments')
  @ApiOperation({ summary: 'List appointments' })
  list(@Query('from') from: string, @Query('to') to: string) { return this.scheduling.listAppointments(from, to); }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment' })
  get(@Param('id') id: string) { return this.scheduling.getAppointment(id); }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id') id: string) { return this.scheduling.cancelAppointment(id); }

  @Get('availability/:userId')
  @ApiOperation({ summary: 'Get available slots' })
  availability(@Param('userId') userId: string, @Query('date') date: string) { return this.scheduling.getAvailability(userId, date); }
}
