import { Controller, Get } from '@nestjs/common';

import { PeopleService } from './people.service.js';

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  async findAll() {
    return this.peopleService.findAll();
  }
}
