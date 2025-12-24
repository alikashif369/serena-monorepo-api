import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AggregateMetricsService } from './aggregate-metrics.service';
import { CreateAggregateMetricDto } from './dto/create-aggregate-metric.dto';
import { UpdateAggregateMetricDto } from './dto/update-aggregate-metric.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('aggregate-metrics')
@Controller('aggregate-metrics')
export class AggregateMetricsController {
  constructor(private readonly service: AggregateMetricsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create aggregate metric (admin only)' })
  create(@Request() req, @Body() dto: CreateAggregateMetricDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List aggregate metrics with filters' })
  @ApiQuery({ name: 'entityType', required: false, enum: ['ORGANIZATION', 'REGION', 'CATEGORY'] })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiQuery({ name: 'regionId', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'metricType', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  findAll(
    @Query('entityType') entityType?: string,
    @Query('organizationId', new ParseIntPipe({ optional: true })) organizationId?: number,
    @Query('regionId', new ParseIntPipe({ optional: true })) regionId?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
    @Query('metricType') metricType?: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number
  ) {
    return this.service.findAll({
      entityType,
      organizationId,
      regionId,
      categoryId,
      metricType,
      year
    });
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get metrics grouped by type' })
  @ApiQuery({ name: 'entityType', required: false, enum: ['ORGANIZATION', 'REGION', 'CATEGORY'] })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiQuery({ name: 'regionId', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  findGrouped(
    @Query('entityType') entityType?: string,
    @Query('organizationId', new ParseIntPipe({ optional: true })) organizationId?: number,
    @Query('regionId', new ParseIntPipe({ optional: true })) regionId?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number
  ) {
    return this.service.findGrouped({
      entityType,
      organizationId,
      regionId,
      categoryId
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single aggregate metric' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update aggregate metric (admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateAggregateMetricDto
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete aggregate metric (admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
