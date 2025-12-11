import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(parseInt(id));
  }

  @Get(':id/sites')
  @ApiOperation({ summary: 'Get sites assigned to user' })
  async getSites(@Param('id') id: string) {
    return this.usersService.getSitesForUser(parseInt(id));
  }
}
