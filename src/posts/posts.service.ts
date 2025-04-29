import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { generateSlug } from '../common/utils/slug.util';
import { MediaUtils } from 'src/common/utils/media.util';
import { handleMediaUpload } from 'src/media/media.handler';


@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(authorId: number, files: Express.Multer.File[], dto: CreatePostDto) {
    return await this.prisma.$transaction(async (tx) => {
        let slug = generateSlug(dto.title);

        const exists = await tx.post.findUnique({ where: { slug } });
        if (exists) {
            slug += `-${Math.random().toString(36).substring(2, 8)}`;
        }

        const model = await tx.post.create({
            data: {
                ...dto,
                slug,
                authorId,
            },
        });

        await handleMediaUpload({
            tx,
            files,
            modelType: 'Post',
            modelId: model.id,
            userId: authorId,
        });

        return model;
    });
}


  async findAll() {
    const posts = await this.prisma.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Lấy tất cả media cho nhiều post 1 lần
    const postIds = posts.map(post => post.id);
    const mediaMap = await MediaUtils.getMediaForModels('Post', postIds);

    return posts.map(post => ({
      ...post,
      media: mediaMap[post.id] || {},
    }));
  }

  async findOne(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid post ID');
    }

    return this.getPostOrFail({ id });
  }

  async findOneBySlug(slug: string) {
    if (!slug) {
      throw new BadRequestException('Slug is required');
    }

    return this.getPostOrFail({ slug });
  }

  async update(id: number, dto: UpdatePostDto) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid post ID');
    }

    await this.ensurePostExists(id);

    let data = { ...dto };

    if (dto.title) {
      data.slug = generateSlug(dto.title);
    }

    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid post ID');
    }

    await this.ensurePostExists(id);

    return this.prisma.post.delete({
      where: { id },
    });
  }

  private async getPostOrFail(where: { id?: number; slug?: string }) {
    const uniqueWhere = where.id ? { id: where.id } : { slug: where.slug };
  
    const post = await this.prisma.post.findUnique({
      where: uniqueWhere,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  
    if (!post) {
      throw new NotFoundException(
        `Post with ${where.id ? `ID ${where.id}` : `slug '${where.slug}'`} not found`
      );
    }
  
    const media = await MediaUtils.getMediaForModel('Post', post.id);

    return {
      ...post,
      media,
    };
  }
  

  private async ensurePostExists(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }
}
