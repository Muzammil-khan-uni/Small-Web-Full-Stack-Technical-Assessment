import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Person } from '../../people/schemas/person.schema.js';

export type VisitDocument = HydratedDocument<Visit>;

@Schema({
  timestamps: true,
})
export class Visit {
  @Prop({
    type: Types.ObjectId,
    ref: Person.name,
    required: true,
    index: true,
  })
  person: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
  })
  address: string;

  @Prop({
    required: true,
    default: false,
  })
  exists: boolean;

  @Prop({
    required: true,
    enum: ['address', 'link', 'history'],
  })
  source: 'address' | 'link' | 'history';
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({
  person: 1,
  createdAt: -1,
});
