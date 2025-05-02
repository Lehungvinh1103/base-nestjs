// media-handler.ts
import * as path from 'path';
import * as fs from 'fs';
import { Media, Prisma, PrismaClient } from '@prisma/client';

export async function handleMediaUpload({
    tx,
    files,
    modelType,
    modelId,
    fieldType = 'default',
    userId,
    collection = 'Mặc định',
}: {
    tx: Prisma.TransactionClient;
    files: Express.Multer.File[];
    modelType: string;
    modelId: number;
    fieldType?: string;
    userId: number;
    collection?: string;
}): Promise<Media[]> {
    const uploadedMedia: Media[] = [];

    if (files.length > 0) {
        await deleteOldMedia(modelType, modelId, tx);
    } else {
        return []; // Không có ảnh mới, giữ nguyên media cũ
    }

    for (const file of files) {
        if (!file) {
            console.error('Invalid file:', file);
            continue;
        }
        try {
            const media = await tx.media.create({
                data: {
                    uuid: file.filename.split('.')[0],
                    name: file.originalname,
                    fileName: file.filename,
                    mimeType: file.mimetype,
                    disk: 'local',
                    size: file.size,
                    collectionName: collection,
                    customProperties: { alt: '', title: '' },
                    userId,
                },
            });

            const mediaDir = path.join(process.cwd(), 'uploads', media.id.toString());
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true });
            }

            const newPath = path.join(mediaDir, file.filename);
            fs.renameSync(file.path, newPath);

            const updatedMedia = await tx.media.update({
                where: { id: media.id },
                data: {
                    fileName: path.join(media.id.toString(), file.filename),
                    modelHasMedia: {
                        create: {
                            modelType,
                            modelId,
                            fieldType,
                        },
                    },
                },
            });

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

    return uploadedMedia;
}

export async function handleSelectedMedia({
    tx,
    mediaIds,
    modelType,
    modelId,
    fieldType = 'default',
}: {
    tx: Prisma.TransactionClient;
    mediaIds: number[];
    modelType: string;
    modelId: number;
    fieldType?: string;
}): Promise<Media[]> {
    if (!mediaIds || mediaIds.length === 0) return [];

    const selectedMedia = await tx.media.findMany({
        where: {
            id: { in: mediaIds },
        },
    });

    // Liên kết ảnh với model
    await tx.modelHasMedia.createMany({
        data: selectedMedia.map(media => ({
            modelType,
            modelId,
            mediaId: media.id,
            fieldType,
        })),
    });

    return selectedMedia;
}

export async function deleteOldMedia(modelType: string, modelId: number, tx: Prisma.TransactionClient) {
  const mediaToDelete = await tx.modelHasMedia.findMany({
    where: { modelType, modelId },
    include: { media: true },
  });

  for (const item of mediaToDelete) {
    const mediaId = item.media.id;

    const mediaDir = path.join(process.cwd(), 'uploads', mediaId.toString());

    await tx.modelHasMedia.delete({ where: { id: item.id } });

    const stillUsed = await tx.modelHasMedia.count({ where: { mediaId } });

    if (stillUsed === 0) {

      await tx.media.delete({ where: { id: mediaId } });


      if (fs.existsSync(mediaDir)) {
        fs.rmSync(mediaDir, { recursive: true, force: true });
      }
    }
  }
}


