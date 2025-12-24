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
import { CategorySummariesService } from './category-summaries.service';
import { CreateCategorySummaryDto } from './dto/create-category-summary.dto';
import { UpdateCategorySummaryDto } from './dto/update-category-summary.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('category-summaries')
@Controller('category-summaries')
export class CategorySummariesController {
  constructor(private readonly service: CategorySummariesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category summary (admin only)' })
  create(@Request() req, @Body() dto: CreateCategorySummaryDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List category summaries with filters' })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiQuery({ name: 'regionId', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  findAll(
    @Query('organizationId', new ParseIntPipe({ optional: true })) organizationId?: number,
    @Query('regionId', new ParseIntPipe({ optional: true })) regionId?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number
  ) {
    return this.service.findAll({
      organizationId,
      regionId,
      categoryId
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category summary' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category summary (admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateCategorySummaryDto
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category summary (admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
