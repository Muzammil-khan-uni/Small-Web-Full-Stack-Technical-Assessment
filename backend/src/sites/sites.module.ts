import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';
import { Site, SiteSchema } from './schemas/site.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Site.name,
        schema: SiteSchema,
      },
    ]),
  ],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
