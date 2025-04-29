import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { LinkMediaDto } from './dto/link-media.dto';
import { QueryMediaDto, GetModelMediaDto } from './dto/query-media.dto';
import * as path from 'path';
import * as fs from 'fs';
import { UsersService } from '../users/users.service';
import { Media, Prisma } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) { }

  async findAll(queryDto: QueryMediaDto) {
    const { page = 1, per_page = 20, collection, search, selected_ids, include_all_media } = queryDto;
    const skip = (page - 1) * per_page;

    // Build the query
    let whereClause: any = {};

    if (collection) {
      whereClause.collectionName = collection;
    }

    if (search) {
      whereClause.OR = [
        { fileName: { contains: search } },
        { customProperties: { path: ['title'], string_contains: search } },
      ];
    }

    // Get paginated results
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where: whereClause,
        skip,
        take: per_page,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where: whereClause }),
    ]);

    // Get distinct collections
    const collectionsResult = await this.prisma.media.findMany({
      distinct: ['collectionName'],
      select: { collectionName: true },
    });

    const collections = collectionsResult
      .map(item => item.collectionName)
      .filter(Boolean);

    // Prepare the response
    const response: any = {
      data: items,
      current_page: page,
      per_page,
      total,
      last_page: Math.ceil(total / per_page),
      collections,
    };

    // Include selected media if requested
    if ((include_all_media || page === 1) && selected_ids?.length) {
      const allSelected = await this.prisma.media.findMany({
        where: {
          id: { in: selected_ids },
        },
      });
      response.allSelectedMedia = allSelected;
    }

    return response;
  }

  async getModelMedia(dto: GetModelMediaDto) {
    const { model_type, model_id, collection } = dto;

    let whereClause: any = {
      modelHasMedia: {
        some: {
          modelType: model_type,
          modelId: model_id,
        },
      },
    };

    if (collection) {
      whereClause.collectionName = collection;
    }

    const media = await this.prisma.media.findMany({
      where: whereClause,
      include: {
        modelHasMedia: true,
      },
    });

    return { media };
  }

  async create(userId, files: Express.Multer.File[], createMediaDto: CreateMediaDto) {
    const { collection, model_type, model_id, field_type, user_id } = createMediaDto;
    const uploadedMedia: Media[] = [];
    console.log('Processing files:', files);
    
    for (const file of files) {
      if (!file) {
        console.error('Invalid file:', file);
        continue;
      }

      try {
        // Create media record first to get the ID
        const mediaData: any = {
          uuid: file.filename.split('.')[0], // Use the filename without extension as UUID
          name: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          disk: 'local',
          size: file.size,
          collectionName: collection ?? 'Mặc định',
          customProperties: { alt: '', title: '' },
          userId: userId,
        };

        // Associate with user if provided
        if (user_id) {
          const user = await this.usersService.findOne(user_id);
          if (user) {
            mediaData.userId = user_id;
          }
        }

        // Create the media in database
        const media = await this.prisma.media.create({
          data: mediaData,
        });

        // Create media directory
        const mediaDir = path.join(process.cwd(), 'uploads', media.id.toString());
        if (!fs.existsSync(mediaDir)) {
          fs.mkdirSync(mediaDir, { recursive: true });
        }

        // Move file to media directory
        const newFilePath = path.join(mediaDir, file.filename);
        fs.renameSync(file.path, newFilePath);

        // Update media record with new file path
        const updatedMedia = await this.prisma.media.update({
          where: { id: media.id },
          data: {
            fileName: path.join(media.id.toString(), file.filename),
          },
        });

        // Link to model if both model_type and model_id are provided
        if (model_type && model_id) {
          await this.prisma.modelHasMedia.create({
            data: {
              mediaId: media.id,
              modelType: model_type,
              modelId: model_id,
              fieldType: field_type ?? 'default',
            },
          });
        }

        uploadedMedia.push(updatedMedia);
      } catch (error) {
        console.error('Error processing file:', error);
        // Clean up the file if it was created
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw error;
      }
    }

    return { uploadedMedia };
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    const updatedMedia = await this.prisma.media.update({
      where: { id },
      data: {
        customProperties: updateMediaDto.custom_properties,
      },
    });

    return { updatedMedia };
  }

  async remove(id: number) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Delete the physical file and directory
    try {
      const mediaDir = path.join(process.cwd(), 'uploads', media.id.toString());
      if (fs.existsSync(mediaDir)) {
        fs.rmSync(mediaDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete the database record
    await this.prisma.media.delete({ where: { id } });

    return { success: true };
  }

  async linkToModel(linkMediaDto: LinkMediaDto) {
    const { media_ids, model_type, model_id, field_type, collection } = linkMediaDto;
    const linkedMedia: Media[] = [];

    for (const mediaId of media_ids) {
      const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
      if (!media) continue;

      // Check if the media is already linked to a model
      const modelHasMedia = await this.prisma.modelHasMedia.findFirst({
        where: {
          mediaId: media.id,
          modelType: model_type,
          modelId: model_id,
        },
      });

      if (!modelHasMedia) {
        const updatedMedia = await this.prisma.media.update({
          where: { id: media.id },
          data: {
            collectionName: collection ?? "Mặc định",
            modelHasMedia: {
              create: {
                modelType: model_type,
                modelId: model_id,
                fieldType: field_type ?? 'default',
              },
            },
          },
        });
        linkedMedia.push(updatedMedia);
      }
    }

    return { linkedMedia };
  }

}