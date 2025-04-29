import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MediaUtils {
    static configService = new ConfigService();
    static UPLOADS_BASE_URL = '/uploads';

    static buildMediaUrl(mediaId: number, fileName: string) {
        const appUrl = this.configService.get<string>('APP_URL'); // Lấy APP_URL từ biến môi trường
        return `${appUrl}${this.UPLOADS_BASE_URL}/${fileName}`;
      }

    static async getMediaForModel(modelType: string, modelId: number) {
        const relations = await prisma.modelHasMedia.findMany({
            where: {
                modelType,
                modelId,
            },
            include: {
                media: {
                    select: {
                        id: true,
                        fileName: true,

                    },
                },
            },
        });

        const mediaMap = {};
        relations.forEach(relation => {
            if (relation.fieldType && relation.media) {
                mediaMap[relation.fieldType] = {
                    id: relation.media.id,
                    fileName: relation.media.fileName,
                    url: this.buildMediaUrl(relation.media.id, relation.media.fileName),
                };
            }
        });

        return mediaMap;
    }

    static async getMediaForModels(modelType: string, modelIds: number[]) {
        const relations = await prisma.modelHasMedia.findMany({
            where: {
                modelType,
                modelId: { in: modelIds },
            },
            include: {
                media: {
                    select: {
                        id: true,
                        fileName: true,
                    },
                },
            },
        });

        const grouped = {};
        relations.forEach(relation => {
            if (!grouped[relation.modelId]) {
                grouped[relation.modelId] = {};
            }
            if (relation.fieldType && relation.media) {
                grouped[relation.modelId][relation.fieldType] = {
                    id: relation.media.id,
                    fileName: relation.media.fileName,
                    url: this.buildMediaUrl(relation.media.id, relation.media.fileName),
                };
            }
        });

        return grouped;
    }
}
