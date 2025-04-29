import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const MediaHandler = createParamDecorator(
  (data: string[], ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const fields = data || ['thumbnail'];
    
    return { body: request.body, fields };
  },
);