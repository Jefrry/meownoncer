import type { DiscordService } from '../../modules/integrations/discord/discord.service.js';
import type { IntegrationService } from '../../modules/integrations/integration.service.js';
import type { VkService } from '../../modules/integrations/vk/vk.service.js';
import type { UserService } from '../../modules/users/user.service.js';
import type { UserStateManager } from '../../modules/users/userStateManager.js';

export type BotHandlerDeps = {
  userService: UserService;
  integrationService: IntegrationService;
  discordService: DiscordService;
  vkService: VkService;
  userStateManager: UserStateManager;
};
