import type { Platform, PlatformIntegration } from '@prisma/client';

export type DiscordIntegrationSettings = {
  webhookUrl: string;
};

export type VkIntegrationSettings = {
  groupId: string;
  accessToken: string;
};

export type IntegrationSettingsByPlatform = {
  DISCORD: DiscordIntegrationSettings;
  VK: VkIntegrationSettings;
};

export type UserIntegration = Omit<PlatformIntegration, 'encryptedSettings'> & {
  settings: IntegrationSettingsByPlatform[Platform];
};
