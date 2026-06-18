import { Markup } from 'telegraf';

export const integrationsKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Discord', 'integrations:discord')],
  [Markup.button.callback('VK', 'integrations:vk')],
  [Markup.button.callback('Назад', 'menu:back')],
]);

export const discordIntegrationKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Подключить Discord', 'discord:connect')],
  [Markup.button.callback('Отключить Discord', 'discord:disconnect')],
  [Markup.button.callback('Назад', 'menu:integrations')],
]);

export const vkIntegrationKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Подключить VK', 'vk:connect')],
  [Markup.button.callback('Отключить VK', 'vk:disconnect')],
  [Markup.button.callback('Назад', 'menu:integrations')],
]);
