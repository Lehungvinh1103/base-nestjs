import { Media } from '@prisma/client';

export interface MediaWithFieldType extends Media {
  field_type?: string;
}
