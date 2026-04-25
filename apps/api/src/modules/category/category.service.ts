import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.category.findMany({
      where: { ...where, parentId: null },
      include: {
        children: {
          where,
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { listings: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { listings: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(data: { name: string; slug: string; description?: string; icon?: string; parentId?: string; sortOrder?: number }) {
    const existing = await this.prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Category slug already exists');

    return this.prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string; slug?: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
