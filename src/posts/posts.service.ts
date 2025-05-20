import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { generateSlug } from '../common/utils/slug.util';
import { MediaUtils } from 'src/common/utils/media.util';
import { cleanUpMediaFolders, deleteOldMedia, handleMediaUpload } from 'src/media/media.handler';
import { Media, Prisma } from '@prisma/client';


@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(authorId: number, files: Express.Multer.File[], dto: CreatePostDto) {
    return await this.prisma.$transaction(async (tx) => {
      let slug = generateSlug(dto.title);
  
      // Ensure unique slug
      const exists = await tx.post.findUnique({ where: { slug } });
      if (exists) {
        slug += `-${Math.random().toString(36).substring(2, 8)}`;
      }
  
      // Tạo bài viết
      const post = await tx.post.create({
        data: {
          ...dto,
          slug,
          authorId,
        },
      });
  
      // Upload media nếu có
      const uploadedMedia = files?.length
        ? await handleMediaUpload({
            tx,
            files,
            modelType: 'Post',
            modelId: post.id,
            userId: authorId,
            collection: dto.collection || 'Mặc định',
          })
        : [];
  
      return this.buildPostWithMediaUrls(tx, post, uploadedMedia);
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

  async update(id: number, dto: UpdatePostDto, files?: Express.Multer.File[], userId?: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid post ID');
    }
  
    await this.ensurePostExists(id);
  
    return await this.prisma.$transaction(async (tx) => {
      const data: any = { ...dto };
  
      if (dto.title) {
        data.slug = generateSlug(dto.title);
      }
  
      // Nếu có media mới
      let uploadedMedia: Media[] = [];
      if (files?.length && userId) {  
        uploadedMedia = await handleMediaUpload({
          tx,
          files,
          modelType: 'Post',
          modelId: id,
          userId,
          collection: dto.collection || 'Mặc định',
        });
      }
  
      const updatedPost = await tx.post.update({
        where: { id },
        data,
      });
  
      return this.buildPostWithMediaUrls(tx, updatedPost, uploadedMedia);
    });
  }  

  async remove(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid post ID');
    }
  
    await this.ensurePostExists(id);
  
    let mediaIdsToDelete: number[] = [];
  
    return await this.prisma.$transaction(async (tx) => {
      mediaIdsToDelete = await deleteOldMedia('Post', id, tx);
  
      const deletedPost = await tx.post.delete({
        where: { id },
      });
  
      return deletedPost;
    }).finally(async () => {
      if (mediaIdsToDelete.length > 0) {
        await cleanUpMediaFolders(mediaIdsToDelete);
      }
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

  private async buildPostWithMediaUrls(
    tx: Prisma.TransactionClient,
    post: any,
    mediaList: Media[],
  ) {
    if (!mediaList.length) return post;
  
    const images = await tx.media.findMany({
      where: { id: { in: mediaList.map((m) => m.id) } },
      select: { id: true, fileName: true, name: true},
    });
  
    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
  
    const imagesWithUrl = images.map((img) => ({
      ...img,
      url: `${baseUrl}/uploads/${img.fileName}`,
    }));
  
    return {
      ...post,
      media: imagesWithUrl,
    };
  }
  
}
