import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BadRequestException, Injectable } from '@nestjs/common';

import { Site, SiteDocument } from './schemas/site.schema.js';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
  ) {}

  async findByAddress(address: string): Promise<SiteDocument | null> {
    const normalizedAddress = address.trim().toLowerCase();

    return this.siteModel
      .findOne({
        address: normalizedAddress,
      })
      .populate('publisher', 'name')
      .exec();
  }

  async search(query: string): Promise<SiteDocument[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    return this.siteModel
      .find({
        $text: {
          $search: normalizedQuery,
        },
      })
      .select({
        score: {
          $meta: 'textScore',
        },
        address: 1,
        title: 1,
        html: 1,
        publisher: 1,
      })
      .sort({
        score: {
          $meta: 'textScore',
        },
      })
      .populate('publisher', 'name')
      .exec();
  }

  async publish(
    address: string,
    html: string,
    publisherId: string,
  ): Promise<SiteDocument> {
    const normalizedAddress = address.trim().toLowerCase();

    if (!normalizedAddress) {
      throw new BadRequestException('Address is required');
    }

    if (!html.trim()) {
      throw new BadRequestException('HTML content is required');
    }

    if (!Types.ObjectId.isValid(publisherId)) {
      throw new BadRequestException('Invalid publisher ID');
    }

    const existingSite = await this.siteModel
      .findOne({ address: normalizedAddress })
      .exec();

    if (existingSite) {
      throw new BadRequestException(
        `Address "${normalizedAddress}" is already published`,
      );
    }

    const createdSite = await this.siteModel.create({
      address: normalizedAddress,
      title: this.extractTitle(html),
      html,
      publisher: new Types.ObjectId(publisherId),
    });

    return createdSite.populate('publisher', 'name');
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);

    if (titleMatch?.[1]) {
      return titleMatch[1]
        .replace(/<[^>]*>/g, '')
        .trim()
        .slice(0, 200);
    }

    const headingMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);

    if (headingMatch?.[1]) {
      return headingMatch[1]
        .replace(/<[^>]*>/g, '')
        .trim()
        .slice(0, 200);
    }

    return 'Untitled Site';
  }
}
