import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { VisitsService } from './visits.service.js';

interface CreateVisitDto {
  personId: string;
  address: string;
  exists: boolean;
  source: 'address' | 'link' | 'history';
}

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  async create(@Body() body: CreateVisitDto) {
    return this.visitsService.create(body);
  }

  @Get('person/:personId')
  async findByPerson(@Param('personId') personId: string) {
    return this.visitsService.findByPerson(personId);
  }
}
