import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModelHasMediaDto } from './dto/create-model-has-media.dto';
import { MediaWithFieldType } from '../common/interfaces/media-with-field-type.interface';


@Injectable()
export class ModelHasMediaService {
  constructor(private prisma: PrismaService) {}

  async create(createModelHasMediaDto: CreateModelHasMediaDto) {
    return this.prisma.modelHasMedia.create({
      data: {
        mediaId: createModelHasMediaDto.media_id,
        modelType: createModelHasMediaDto.model_type,
        modelId: createModelHasMediaDto.model_id,
        fieldType: createModelHasMediaDto.field_type,
      },
    });
  }

  async findAll(modelType: string, modelId: number) {
    return this.prisma.modelHasMedia.findMany({
      where: {
        modelType,
        modelId,
      },
      include: {
        media: true,
      },
    });
  }

  async removeAllForModel(modelType: string, modelId: number) {
    return this.prisma.modelHasMedia.deleteMany({
      where: {
        modelType,
        modelId,
      },
    });
  }

  async handleMediaForModel(modelType: string, modelId: number, data: any, fields: string[] = ['thumbnail']) {
    // First remove all existing relationships
    await this.removeAllForModel(modelType, modelId);

    // Collect all media to associate
    const allMedia: MediaWithFieldType[] = [];

    for (const field of fields) {
      if (!data[field] || data[field].length === 0) {
        continue;
      }

      if (!Array.isArray(data[field]) || !data[field][0]) {
        const mediaItem = data[field];
        mediaItem.field_type = field;
        allMedia.push(mediaItem);
      } else {
        for (const media of data[field]) {
          if (media && typeof media === 'object') {
            media.field_type = field;
            allMedia.push(media);
          }
        }
      }
    }

    // Create new relationships
    for (const media of allMedia) {
      if (media && media.id) {
        await this.create({
          media_id: Number(media.id),
          model_type: modelType,
          model_id: modelId,
          field_type: media.field_type || 'thumbnail',
        });
      }
    }
  }
}