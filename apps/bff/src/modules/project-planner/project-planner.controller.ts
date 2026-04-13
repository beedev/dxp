import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPlannerPort } from './ports/project-planner.port';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectPlannerController {
  constructor(private readonly planner: ProjectPlannerPort) {}

  @Get()
  @ApiOperation({ summary: 'List all project templates' })
  listTemplates() {
    return this.planner.listTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project template by ID' })
  getTemplate(@Param('id') id: string) {
    return this.planner.getTemplate(id);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: 'Get materials list for a project' })
  getMaterialsList(@Param('id') id: string) {
    return this.planner.getMaterialsList(id);
  }
}
