import { Injectable } from '@nestjs/common';
import { ModelHasMediaService } from '../model-has-media/model-has-media.service';

@Injectable()
export class MediaUtils {
  constructor(private modelHasMediaService: ModelHasMediaService) {}

  /**
   * Handle media attachments for a model
   * @param modelType The class name of the model
   * @param modelId The ID of the model
   * @param data The request data containing media fields
   * @param fields Array of field names to process
   */
  async handleMedia(modelType: string, modelId: number, data: any, fields: string[] = ['thumbnail']) {
    await this.modelHasMediaService.handleMediaForModel(modelType, modelId, data, fields);
  }
}