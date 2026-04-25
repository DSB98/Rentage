import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '@rentage/shared-types';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoryService.findAll(includeInactive === 'true');
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin)' })
  async create(@Body() data: { name: string; slug: string; description?: string; icon?: string; parentId?: string; sortOrder?: number }) {
    return this.categoryService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (admin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (admin)' })
  async delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
