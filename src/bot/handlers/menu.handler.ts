import { Telegraf } from 'telegraf';

import { DiscordService } from '../../modules/integrations/discord/discord.service.js';
import { IntegrationService } from '../../modules/integrations/integration.service.js';
import { VkService } from '../../modules/integrations/vk/vk.service.js';
import { UserService } from '../../modules/users/user.service.js';
import { UserStateManager } from '../../modules/users/userStateManager.js';
import { AnnouncementHandler } from './announcement.handler.js';
import { IntegrationHandler } from './integrations.handler.js';
import { NavigationHandler } from './navigation.handler.js';
import { StateMessageHandler } from './stateMessage.handler.js';
import type { BotHandlerDeps } from './types.js';

class MenuHandlerRegistry {
  private readonly deps: BotHandlerDeps;

  constructor(private readonly bot: Telegraf) {
    this.deps = {
      userService: new UserService(),
      integrationService: new IntegrationService(),
      discordService: new DiscordService(),
      vkService: new VkService(),
      userStateManager: new UserStateManager(),
    };
  }

  register(): void {
    new NavigationHandler(this.bot).register();
    new StateMessageHandler(this.bot, this.deps).register();
    new AnnouncementHandler(this.bot, this.deps).register();
    new IntegrationHandler(this.bot, this.deps).register();
  }
}

export function registerMenuHandlers(bot: Telegraf): void {
  new MenuHandlerRegistry(bot).register();
}
