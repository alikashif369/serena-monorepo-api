import { Controller, Get, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HierarchyService } from './hierarchy.service';

@ApiTags('Hierarchy')
@Controller('hierarchy')
export class HierarchyController {
  constructor(private hierarchyService: HierarchyService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full organization hierarchy tree (5-min cache)' })
  async getFullTree() {
    console.log("[HIERARCHY_CONTROLLER] GET /tree called");
    const result = await this.hierarchyService.getFullTree();
    console.log("[HIERARCHY_CONTROLLER] Returning result, type:", typeof result, "is array:", Array.isArray(result), "length:", result?.length);
    return result;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search sites across hierarchy' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category', type: Number })
  @ApiQuery({ name: 'siteType', required: false, description: 'Filter by site type' })
  async searchSites(@Query('q') q: string, @Query() filters: any) {
    return this.hierarchyService.searchSites(q, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated hierarchy statistics' })
  async getStatistics() {
    return this.hierarchyService.getStatistics();
  }

  @Post('cache-clear')
  @ApiOperation({ summary: 'Clear hierarchy cache (for debugging)' })
  async clearCache() {
    console.log("[HIERARCHY_CONTROLLER] Cache clear requested");
    await this.hierarchyService.clearCache();
    return { message: "Cache cleared" };
  }

  @Get('debug')
  @ApiOperation({ summary: 'Debug endpoint - check database directly' })
  async debugHierarchy() {
    console.log("[HIERARCHY_CONTROLLER] Debug endpoint called");
    return await this.hierarchyService.debugDatabase();
  }
}
