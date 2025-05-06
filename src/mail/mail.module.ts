import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST as string,
        port: parseInt(process.env.MAIL_PORT as string),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER as string,
          pass: process.env.MAIL_PASSWORD as string,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.MAIL_FROM as string}>`,
      },
      template: {
        dir: join(process.cwd(), 'src', 'mail', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {} 