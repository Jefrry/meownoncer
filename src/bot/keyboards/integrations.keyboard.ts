import { Markup } from 'telegraf';

export const integrationsKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Discord', 'integrations:discord')],
  [Markup.button.callback('VK', 'integrations:vk')],
  [Markup.button.callback('Назад', 'menu:back')],
]);
