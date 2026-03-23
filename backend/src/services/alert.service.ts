import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Alert severity levels.
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Alert payload structure.
 */
export interface Alert {
  timestamp: Date;
  severity: AlertSeverity;
  title: string;
  description: string;
  environment: string;
  serverId: string;
  requestId?: string;
  affectedUserId?: string;
  stackTrace?: string;
}

/**
 * Unified Alert Service.
 * Dispatches alerts to all configured channels simultaneously.
 */
class AlertService {
  private emailTransporter: nodemailer.Transporter | null = null;
  private slackWebhookUrl: string | null = null;

  constructor() {
    // Initialize email transporter
    if (env.ENABLE_EMAIL_ALERTS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }

    // Initialize Slack webhook
    if (env.ENABLE_SLACK_ALERTS && env.SLACK_WEBHOOK_URL) {
      this.slackWebhookUrl = env.SLACK_WEBHOOK_URL;
    }
  }

  /**
   * Send alert to all configured channels.
   * Fire-and-forget async - does not block or crash on failure.
   */
  async send(alert: Alert): Promise<void> {
    // Log alert regardless of channels
    this.logAlert(alert);

    // Dispatch to all channels simultaneously
    const promises: Promise<void>[] = [];

    if (env.ENABLE_EMAIL_ALERTS && this.emailTransporter) {
      promises.push(this.sendEmail(alert).catch(err => {
        logger.error('Failed to send email alert', { error: err.message, alertTitle: alert.title });
      }));
    }

    if (env.ENABLE_SLACK_ALERTS && this.slackWebhookUrl) {
      promises.push(this.sendSlack(alert).catch(err => {
        logger.error('Failed to send Slack alert', { error: err.message, alertTitle: alert.title });
      }));
    }

    if (env.ENABLE_SMS_ALERTS && alert.severity === 'critical') {
      promises.push(this.sendSMS(alert).catch(err => {
        logger.error('Failed to send SMS alert', { error: err.message, alertTitle: alert.title });
      }));
    }

    // Fire and forget - don't wait for results
    Promise.all(promises);
  }

  /**
   * Log alert to application logs.
   */
  private logAlert(alert: Alert): void {
    const logMethod = alert.severity === 'critical' || alert.severity === 'high' 
      ? logger.error 
      : alert.severity === 'medium' 
        ? logger.warn 
        : logger.info;

    logMethod(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`, {
      description: alert.description,
      serverId: alert.serverId,
      requestId: alert.requestId,
      affectedUserId: alert.affectedUserId,
    });
  }

  /**
   * Send email alert.
   */
  private async sendEmail(alert: Alert): Promise<void> {
    if (!this.emailTransporter) return;

    const subject = `[${alert.severity.toUpperCase()}] ${alert.title} - QUEENTHAIR ${env.NODE_ENV}`;
    
    const html = `
      <h2 style="color: ${this.getSeverityColor(alert.severity)};">${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Environment:</strong> ${alert.environment}</p>
      <p><strong>Server:</strong> ${alert.serverId}</p>
      ${alert.requestId ? `<p><strong>Request ID:</strong> ${alert.requestId}</p>` : ''}
      ${alert.affectedUserId ? `<p><strong>Affected User:</strong> ${alert.affectedUserId}</p>` : ''}
      <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
      <h3>Description</h3>
      <p>${alert.description}</p>
      ${alert.stackTrace ? `<h3>Stack Trace</h3><pre>${alert.stackTrace}</pre>` : ''}
    `;

    await this.emailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: env.getAlertEmailRecipients().join(', '),
      subject,
      html,
    });
  }

  /**
   * Send Slack webhook alert.
   */
  private async sendSlack(alert: Alert): Promise<void> {
    if (!this.slackWebhookUrl) return;

    const color = this.getSlackColor(alert.severity);

    const payload = {
      attachments: [{
        color,
        title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        fields: [
          { title: 'Environment', value: alert.environment, short: true },
          { title: 'Server', value: alert.serverId, short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          ...(alert.requestId ? [{ title: 'Request ID', value: alert.requestId, short: true }] : []),
          ...(alert.affectedUserId ? [{ title: 'Affected User', value: alert.affectedUserId, short: true }] : []),
        ],
        text: alert.description,
        ...(alert.stackTrace ? { footer: alert.stackTrace.substring(0, 500) } : {}),
      }],
    };

    const response = await fetch(this.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send SMS alert via Twilio (critical only).
   */
  private async sendSMS(alert: Alert): Promise<void> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM || !env.TWILIO_ALERT_TO) {
      return;
    }

    const twilio = await import('twilio');
    const client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    const message = `QUEENTHAIR ALERT [${alert.severity.toUpperCase()}]: ${alert.title}. ${alert.description.substring(0, 100)}...`;

    await client.messages.create({
      body: message,
      from: env.TWILIO_FROM,
      to: env.TWILIO_ALERT_TO,
    });
  }

  /**
   * Get color for severity level.
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#CA8A04',
      low: '#0891B2',
    };
    return colors[severity];
  }

  /**
   * Get Slack color code for severity level.
   */
  private getSlackColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      critical: 'danger',
      high: 'warning',
      medium: '#CA8A04',
      low: 'good',
    };
    return colors[severity];
  }
}

// Export singleton instance
export const alertService = new AlertService();
