import { Controller, Get, Param } from '@nestjs/common';

import { VisitsService } from './visits.service.js';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('person/:personId')
  async findByPerson(@Param('personId') personId: string) {
    return this.visitsService.findByPerson(personId);
  }
}
