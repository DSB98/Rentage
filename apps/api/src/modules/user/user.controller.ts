import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: { fullName?: string; phone?: string; bio?: string; city?: string; state?: string },
  ) {
    return this.userService.updateProfile(userId, data);
  }
}
