import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Person } from '../../people/schemas/person.schema.js';

export type SiteDocument = HydratedDocument<Site>;

@Schema({
  timestamps: true,
})
export class Site {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  address: string;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  html: string;

  @Prop({
    type: Types.ObjectId,
    ref: Person.name,
    required: true,
  })
  publisher: Types.ObjectId;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({
  title: 'text',
  html: 'text',
});
