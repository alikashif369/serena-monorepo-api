import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set - emails will be logged to console');
    }
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    inviterName: string,
  ): Promise<{ success: boolean; message: string }> {
    const inviteUrl = `${this.frontendUrl}/accept-invitation?token=${token}`;

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@serenagreen.com';
    const expiryHours = 168; // 7 days

    const emailContent = {
      to: email,
      from: this.fromEmail,
      subject: '🔐 You\'re invited to join SerenaGreen Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SerenaGreen</h1>
            <p style="color: #a8d5ba; margin: 10px 0 0 0;">Environmental Conservation Platform</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a472a; margin-top: 0;">🎉 Welcome to the Team!</h2>

            <p>Hello,</p>

            <p><strong>${inviterName}</strong> has invited you to join the SerenaGreen admin team as an administrator.</p>

            <p><strong>📧 Invitation for:</strong> ${email}</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}"
                 style="background-color: #1a472a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🔒 Accept Invitation & Set Password
              </a>
            </div>

            <div style="background: #fff; border-left: 4px solid #1a472a; padding: 15px; margin: 20px 0;">
              <h3 style="color: #1a472a; margin-top: 0; font-size: 16px;">🔐 Password Requirements:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Minimum 8 characters long</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (!@#$%^&*)</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 25px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 4px; font-size: 11px; border: 1px solid #ddd;">
              ${inviteUrl}
            </p>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #856404;">
                <strong>⚠️ Security Notice:</strong><br>
                • This invitation link is unique to you and should not be shared<br>
                • The link expires in <strong>${expiryHours} hours (7 days)</strong><br>
                • You can only use this link once to create your account<br>
                • Always verify the URL starts with your organization's domain
              </p>
            </div>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #721c24;">
                <strong>🚨 Didn't Request This?</strong><br>
                If you didn't expect this invitation, please:
              </p>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 13px; color: #721c24;">
                <li>Do NOT click the link above</li>
                <li>Forward this email to <a href="mailto:${adminEmail}" style="color: #721c24;">${adminEmail}</a></li>
                <li>Delete this email immediately</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #888; font-size: 11px; text-align: center; margin: 0;">
              This is an automated message from SerenaGreen Admin System.<br>
              For support, contact: <a href="mailto:${adminEmail}" style="color: #1a472a;">${adminEmail}</a><br>
              © ${new Date().getFullYear()} SerenaGreen. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    // If Resend is configured, send the email
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send(emailContent);

        if (error) {
          this.logger.error(`Failed to send invitation email: ${error.message}`);
          return { success: false, message: error.message };
        }

        this.logger.log(`Invitation email sent to ${email} (id: ${data?.id})`);
        return { success: true, message: 'Invitation email sent successfully' };
      } catch (error) {
        this.logger.error(`Failed to send invitation email: ${error.message}`);
        return { success: false, message: error.message };
      }
    }

    // Fallback: Log to console for development
    this.logger.log('='.repeat(60));
    this.logger.log('INVITATION EMAIL (Development Mode)');
    this.logger.log('='.repeat(60));
    this.logger.log(`To: ${email}`);
    this.logger.log(`From: ${this.fromEmail}`);
    this.logger.log(`Subject: ${emailContent.subject}`);
    this.logger.log(`Invited by: ${inviterName}`);
    this.logger.log('');
    this.logger.log('INVITATION LINK:');
    this.logger.log(inviteUrl);
    this.logger.log('='.repeat(60));

    return { success: true, message: 'Invitation logged to console (development mode)' };
  }
}
