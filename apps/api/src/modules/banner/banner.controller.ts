import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannerService } from './banner.service';

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(private bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get active homepage banners' })
  async findActive() {
    return this.bannerService.findActive();
  }
}
