import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Visit, VisitDocument } from './schemas/visit.schema.js';

interface CreateVisitInput {
  personId: string;
  address: string;
  exists: boolean;
  source: 'address' | 'link' | 'history';
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,
  ) {}

  async create(input: CreateVisitInput): Promise<VisitDocument> {
    if (!Types.ObjectId.isValid(input.personId)) {
      throw new BadRequestException('Invalid person ID');
    }

    const normalizedAddress = input.address.trim().toLowerCase();

    if (!normalizedAddress) {
      throw new BadRequestException('Address is required');
    }

    return this.visitModel.create({
      person: new Types.ObjectId(input.personId),
      address: normalizedAddress,
      exists: input.exists,
      source: input.source,
    });
  }

  async findByPerson(personId: string): Promise<VisitDocument[]> {
    if (!Types.ObjectId.isValid(personId)) {
      throw new BadRequestException('Invalid person ID');
    }

    return this.visitModel
      .find({
        person: new Types.ObjectId(personId),
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }
}
