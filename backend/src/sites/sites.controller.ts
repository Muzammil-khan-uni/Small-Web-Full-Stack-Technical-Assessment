import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { VisitsService } from '../visits/visits.service.js';
import { SitesService } from './sites.service.js';

interface BrowseSiteDto {
  personId: string;
  address: string;
  source: 'address' | 'link' | 'history';
}

interface PublishSiteDto {
  address: string;
  html: string;
  publisherId: string;
}

@Controller('sites')
export class SitesController {
  constructor(
    private readonly sitesService: SitesService,
    private readonly visitsService: VisitsService,
  ) {}

  @Post('browse')
  async browse(@Body() body: BrowseSiteDto) {
    const address = body.address?.trim().toLowerCase();

    if (!body.personId) {
      throw new BadRequestException('personId is required');
    }

    if (!address) {
      throw new BadRequestException('address is required');
    }

    if (!['address', 'link', 'history'].includes(body.source)) {
      throw new BadRequestException('source must be address, link, or history');
    }

    const site = await this.sitesService.findByAddress(address);

    await this.visitsService.create({
      personId: body.personId,
      address,
      exists: Boolean(site),
      source: body.source,
    });

    if (!site) {
      return {
        exists: false,
        address,
        site: null,
      };
    }

    return {
      exists: true,
      address,
      site,
    };
  }

  @Get('search/query')
  async search(@Query('q') query?: string) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    return this.sitesService.search(normalizedQuery);
  }

  @Post()
  async publish(@Body() body: PublishSiteDto) {
    if (!body.publisherId) {
      throw new BadRequestException('publisherId is required');
    }

    if (!body.address?.trim()) {
      throw new BadRequestException('address is required');
    }

    if (!body.html?.trim()) {
      throw new BadRequestException('html is required');
    }

    return this.sitesService.publish(body.address, body.html, body.publisherId);
  }

  @Get(':address')
  async findByAddress(@Param('address') address: string) {
    const site = await this.sitesService.findByAddress(address);

    if (!site) {
      throw new NotFoundException(`Site "${address}" was not found`);
    }

    return site;
  }
}
