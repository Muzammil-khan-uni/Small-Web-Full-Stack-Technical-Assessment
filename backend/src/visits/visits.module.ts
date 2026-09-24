import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VisitsController } from './visits.controller.js';
import { VisitsService } from './visits.service.js';
import { Visit, VisitSchema } from './schemas/visit.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Visit.name,
        schema: VisitSchema,
      },
    ]),
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
