import type { InteractionSession, PrismaClient } from "@prisma/client";

function toDateFromUnixSeconds(value: string | null): Date {
  if (!value) return new Date();
  const asNumber = Number(value);
  if (Number.isNaN(asNumber)) return new Date();
  return new Date(asNumber * 1000);
}

export class SessionService {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async ensureOpenSession(contactId: string): Promise<InteractionSession> {
    const existing = await this.prisma.interactionSession.findFirst({
      where: {
        contactId,
        status: "open",
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (existing) return existing;

    return this.prisma.interactionSession.create({
      data: {
        contactId,
        status: "open",
      },
    });
  }

  async touchInbound(
    contactId: string,
    timestamp: string | null
  ): Promise<InteractionSession> {
    const session = await this.ensureOpenSession(contactId);
    return this.prisma.interactionSession.update({
      where: { id: session.id },
      data: {
        lastInboundAt: toDateFromUnixSeconds(timestamp),
      },
    });
  }

  async touchOutbound(contactId: string): Promise<InteractionSession> {
    const session = await this.ensureOpenSession(contactId);
    return this.prisma.interactionSession.update({
      where: { id: session.id },
      data: {
        lastOutboundAt: new Date(),
      },
    });
  }
}
