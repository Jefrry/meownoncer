import { Platform } from '@prisma/client';

import { decryptJson, encryptJson } from '../../utils/crypto.js';
import { IntegrationRepository } from './integration.repository.js';
import type {
  DiscordIntegrationSettings,
  IntegrationSettingsByPlatform,
  UserIntegration,
  VkIntegrationSettings,
} from './integration.types.js';

export class IntegrationService {
  constructor(
    private readonly integrationRepository = new IntegrationRepository(),
  ) {}

  connectDiscord(userId: string, webhookUrl: string) {
    const encryptedSettings = encryptJson({ webhookUrl });

    return this.integrationRepository.upsertIntegration(
      userId,
      Platform.DISCORD,
      encryptedSettings,
    );
  }

  getDiscordIntegration(userId: string) {
    return this.integrationRepository.findByUserAndPlatform(
      userId,
      Platform.DISCORD,
    );
  }

  disconnectDiscord(userId: string) {
    return this.integrationRepository.deleteIntegration(userId, Platform.DISCORD);
  }

  getVkIntegration(userId: string) {
    return this.integrationRepository.findByUserAndPlatform(userId, Platform.VK);
  }

  connectVk(userId: string, settings: VkIntegrationSettings) {
    const encryptedSettings = encryptJson(settings);

    return this.integrationRepository.upsertIntegration(
      userId,
      Platform.VK,
      encryptedSettings,
    );
  }

  disconnectVk(userId: string) {
    return this.integrationRepository.deleteIntegration(userId, Platform.VK);
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    const integrations =
      await this.integrationRepository.getUserIntegrations(userId);

    return integrations.map(({ encryptedSettings, ...integration }) => ({
      ...integration,
      settings: decryptJson<
        IntegrationSettingsByPlatform[typeof integration.platform]
      >(encryptedSettings),
    }));
  }
}

export type { DiscordIntegrationSettings, VkIntegrationSettings };
