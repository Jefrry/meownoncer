const VK_API_URL = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';

type VkIntegrationSettings = {
  groupId: string;
  accessToken: string;
};

type PublishAnnouncementParams = VkIntegrationSettings & {
  text: string;
  imageUrl?: string;
};

type VkApiError = {
  error_code?: number;
  error_msg?: string;
};

type VkApiResponse<T> =
  | {
      response: T;
      error?: never;
    }
  | {
      response?: never;
      error: VkApiError;
    };

type WallPostResponse = {
  post_id?: number;
};

export class VkService {
  async testConnection(settings: VkIntegrationSettings): Promise<void> {
    await this.callVkApi<unknown>('groups.getById', {
      group_id: settings.groupId,
      access_token: settings.accessToken,
    });
  }

  async publishAnnouncement({
    groupId,
    accessToken,
    text,
    imageUrl,
  }: PublishAnnouncementParams): Promise<{ externalPostUrl?: string }> {
    const numericGroupId = Number(groupId);

    if (!Number.isInteger(numericGroupId) || numericGroupId <= 0) {
      throw new Error('VK groupId должен быть положительным числом.');
    }

    // TODO: upload imageUrl to VK and pass it through attachments.
    void imageUrl;

    const response = await this.callVkApi<WallPostResponse>('wall.post', {
      owner_id: String(-numericGroupId),
      from_group: '1',
      message: text,
      access_token: accessToken,
    });

    if (!response.post_id) {
      return {};
    }

    return {
      externalPostUrl: `https://vk.com/wall-${numericGroupId}_${response.post_id}`,
    };
  }

  private async callVkApi<T>(
    method: string,
    params: Record<string, string>,
  ): Promise<T> {
    const body = new URLSearchParams({
      ...params,
      v: VK_API_VERSION,
    });

    let response: Response;

    try {
      response = await fetch(`${VK_API_URL}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    } catch {
      throw new Error(
        'Не удалось подключиться к VK. Проверь данные и попробуй ещё раз.',
      );
    }

    if (!response.ok) {
      throw new Error(
        `VK API вернул ошибку ${response.status}. Проверь groupId, токен и права доступа.`,
      );
    }

    let payload: VkApiResponse<T>;

    try {
      payload = (await response.json()) as VkApiResponse<T>;
    } catch {
      throw new Error('VK вернул некорректный ответ. Попробуй ещё раз.');
    }

    if (payload.error) {
      const codeText =
        typeof payload.error.error_code === 'number'
          ? ` Код ошибки: ${payload.error.error_code}.`
          : '';

      throw new Error(
        `VK не подтвердил подключение.${codeText} Проверь groupId, токен и права доступа.`,
      );
    }

    return payload.response;
  }
}
