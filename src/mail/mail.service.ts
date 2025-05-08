import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private mailerService: MailerService) { }

    async sendResetPasswordEmail(email: string, resetToken: string, name: string) {
        if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
            throw new BadRequestException('Mailer configuration is missing.');
        }
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        const img = `${process.env.APP_URL}/uploads/logo/maxima-logo.png`;
        const appName = process.env.APP_NAME ?? 'APP_NAME';

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Reset Password Request',
                template: 'reset-password',
                context: {
                    resetUrl,
                    img,
                    appName,
                    name,   
                },
            });
            this.logger.log(`Reset password email sent to: ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send reset password email to ${email}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to send reset password email.');
        }
    }
} 