type SendAnnouncementParams = {
  webhookUrl: string;
  text: string;
  imageUrl?: string;
};

type DiscordWebhookMessage = {
  id?: string;
};

export class DiscordService {
  validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'https:') {
        return false;
      }

      if (
        parsedUrl.hostname !== 'discord.com' &&
        parsedUrl.hostname !== 'discordapp.com'
      ) {
        return false;
      }

      return /^\/api\/webhooks\/\d+\/[\w.-]+\/?$/.test(parsedUrl.pathname);
    } catch {
      return false;
    }
  }

  async sendTestMessage(webhookUrl: string): Promise<void> {
    const testMessage = await this.sendWebhookMessage({
      webhookUrl: this.getWebhookUrlWithWait(webhookUrl),
      content: 'Тестовое сообщение Meownoncer',
      errorMessage:
        'Не удалось отправить тестовое сообщение в Discord. Проверь webhook URL и попробуй ещё раз.',
      shouldReturnMessage: true,
    });

    if (!testMessage.id) {
      throw new Error(
        'Discord не вернул ID тестового сообщения. Проверь webhook URL и попробуй ещё раз.',
      );
    }

    await this.deleteWebhookMessage(webhookUrl, testMessage.id);
  }

  async sendAnnouncement({
    webhookUrl,
    text,
  }: SendAnnouncementParams): Promise<void> {
    await this.sendWebhookMessage({
      webhookUrl,
      content: text,
      errorMessage:
        'Не удалось отправить сообщение в Discord. Проверь webhook URL и попробуй ещё раз.',
      shouldReturnMessage: false,
    });
  }

  private async sendWebhookMessage({
    webhookUrl,
    content,
    errorMessage,
    shouldReturnMessage,
  }: {
    webhookUrl: string;
    content: string;
    errorMessage: string;
    shouldReturnMessage: boolean;
  }): Promise<DiscordWebhookMessage> {
    let response: Response;

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
    } catch {
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      throw new Error(
        `Discord webhook вернул ошибку ${response.status}. Проверь URL и права webhook.`,
      );
    }

    if (!shouldReturnMessage) {
      return {};
    }

    return (await response.json()) as DiscordWebhookMessage;
  }

  private async deleteWebhookMessage(
    webhookUrl: string,
    messageId: string,
  ): Promise<void> {
    const deleteUrl = this.getWebhookMessageUrl(webhookUrl, messageId);
    let response: Response;

    try {
      response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
    } catch {
      throw new Error(
        'Тестовое сообщение отправлено, но не удалось удалить его из Discord.',
      );
    }

    if (!response.ok) {
      throw new Error(
        `Тестовое сообщение отправлено, но Discord вернул ошибку удаления ${response.status}.`,
      );
    }
  }

  private getWebhookUrlWithWait(webhookUrl: string): string {
    const url = new URL(webhookUrl);
    url.searchParams.set('wait', 'true');

    return url.toString();
  }

  private getWebhookMessageUrl(webhookUrl: string, messageId: string): string {
    const url = new URL(webhookUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/messages/${messageId}`;
    url.search = '';

    return url.toString();
  }
}
