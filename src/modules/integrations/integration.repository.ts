import type { Platform } from '@prisma/client';

import { prisma } from '../../db/prisma.js';

export class IntegrationRepository {
  findByUserAndPlatform(userId: string, platform: Platform) {
    return prisma.platformIntegration.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });
  }

  upsertIntegration(
    userId: string,
    platform: Platform,
    encryptedSettings: string,
  ) {
    return prisma.platformIntegration.upsert({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      create: {
        userId,
        platform,
        encryptedSettings,
      },
      update: {
        encryptedSettings,
      },
    });
  }

  getUserIntegrations(userId: string) {
    return prisma.platformIntegration.findMany({
      where: {
        userId,
      },
    });
  }

  deleteIntegration(userId: string, platform: Platform) {
    return prisma.platformIntegration.deleteMany({
      where: {
        userId,
        platform,
      },
    });
  }
}
