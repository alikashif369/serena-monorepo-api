import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VectorServiceService } from './vector-service.service';
import { CreateVectorLayerDto } from './dto/create-vector-layer.dto';
import { UpdateVectorLayerDto } from './dto/update-vector-layer.dto';
import { JwtAuthGuard } from '@shared-config/authentication/guards';

@ApiTags('vector-layers')
@Controller('vector-layers')
export class VectorServiceController {
  constructor(private readonly vectorServiceService: VectorServiceService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new vector layer' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Vector layer created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createVectorLayerDto: CreateVectorLayerDto, @Request() req: any) {
    return this.vectorServiceService.create(createVectorLayerDto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vector layers' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all vector layers' 
  })
  findAll() {
    return this.vectorServiceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vector layer by ID' })
  @ApiParam({ name: 'id', description: 'Vector layer UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the vector layer' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Vector layer not found' 
  })
  findOne(@Param('id') id: string) {
    return this.vectorServiceService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a vector layer' })
  @ApiParam({ name: 'id', description: 'Vector layer UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Vector layer updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Vector layer not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  update(@Param('id') id: string, @Body() updateVectorLayerDto: UpdateVectorLayerDto) {
    return this.vectorServiceService.update(id, updateVectorLayerDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a vector layer (soft delete)' })
  @ApiParam({ name: 'id', description: 'Vector layer UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Vector layer deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Vector layer not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access' 
  })
  remove(@Param('id') id: string) {
    return this.vectorServiceService.remove(id);
  }
}