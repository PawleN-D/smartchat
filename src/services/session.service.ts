function toDateFromUnixSeconds(value) {
  if (!value) return new Date();
  const asNumber = Number(value);
  if (Number.isNaN(asNumber)) return new Date();
  return new Date(asNumber * 1000);
}

export class SessionService {
  prisma: any;

  constructor({ prisma }: any) {
    this.prisma = prisma;
  }

  async ensureOpenSession(contactId) {
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

  async touchInbound(contactId, timestamp) {
    const session = await this.ensureOpenSession(contactId);
    return this.prisma.interactionSession.update({
      where: { id: session.id },
      data: {
        lastInboundAt: toDateFromUnixSeconds(timestamp),
      },
    });
  }

  async touchOutbound(contactId) {
    const session = await this.ensureOpenSession(contactId);
    return this.prisma.interactionSession.update({
      where: { id: session.id },
      data: {
        lastOutboundAt: new Date(),
      },
    });
  }
}
