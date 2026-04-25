import {
  Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@rentage/shared-types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── DASHBOARD ────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('stats/charts')
  @ApiOperation({ summary: 'Get chart data for dashboard' })
  async getChartData(@Query('period') period?: string) {
    return this.adminService.getChartData(period || '30d');
  }

  @Get('stats/recent-activity')
  @ApiOperation({ summary: 'Get recent platform activity' })
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  // ─── USER MANAGEMENT ─────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search, role, status, sort,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details with stats' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  async toggleUserActive(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.toggleUserActive(id, adminId);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  async changeUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.changeUserRole(id, role, adminId);
  }

  // ─── LISTING MODERATION ───────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'List all listings with filters' })
  async getListings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getListings({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status, categoryId, search, sort,
    });
  }

  @Patch('listings/:id/approve')
  @ApiOperation({ summary: 'Approve a listing' })
  async approveListing(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.approveListing(id, adminId);
  }

  @Patch('listings/:id/reject')
  @ApiOperation({ summary: 'Reject a listing' })
  async rejectListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.rejectListing(id, reason, adminId);
  }

  @Patch('listings/:id/feature')
  @ApiOperation({ summary: 'Toggle featured status' })
  async toggleFeatured(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.toggleFeatured(id, adminId);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Remove a listing' })
  async removeListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.removeListing(id, reason, adminId);
  }

  // ─── CATEGORY MANAGEMENT ─────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with listing counts' })
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(
    @Body() data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number },
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.createCategory(data, adminId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updateCategory(id, data, adminId);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.deleteCategory(id, adminId);
  }

  // ─── SUBSCRIPTION PLANS ──────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create subscription plan' })
  async createPlan(@Body() data: any, @CurrentUser('id') adminId: string) {
    return this.adminService.createPlan(data, adminId);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updatePlan(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updatePlan(id, data, adminId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deletePlan(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.deletePlan(id, adminId);
  }

  // ─── REPORTS ──────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'Get all reports' })
  async getReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReports({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve a report' })
  async resolveReport(
    @Param('id') id: string,
    @Body() body: { action: string; adminNotes?: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.resolveReport(id, body.action, body.adminNotes, adminId);
  }

  @Patch('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  async dismissReport(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.dismissReport(id, adminNotes, adminId);
  }

  // ─── AUDIT LOG ────────────────────────────────────

  @Get('audit-log')
  @ApiOperation({ summary: 'Get admin audit log' })
  async getAuditLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.adminService.getAuditLog({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      action, entity,
    });
  }
}
