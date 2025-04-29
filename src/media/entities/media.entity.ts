import { Prisma } from '@prisma/client';

export class Media implements Prisma.MediaUncheckedCreateInput {
  id?: number;
  userId?: number;
  uuid: string;
  collectionName?: string;
  name: string;
  fileName: string;
  mimeType?: string;
  disk: string;
  size: number;
  customProperties: Prisma.InputJsonValue;
  orderColumn?: number;
  createdAt?: Date;
  updatedAt?: Date;
}