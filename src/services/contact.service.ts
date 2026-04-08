import {
  Prisma,
  type Contact,
  type ContactType,
  type PrismaClient,
} from "@prisma/client";

interface GetOrCreateInput {
  waId: string;
  name: string | null;
}

interface GetOrCreateResult {
  contact: Contact;
  created: boolean;
}

export class ContactService {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async getOrCreate({ waId, name }: GetOrCreateInput): Promise<GetOrCreateResult> {
    const existing = await this.prisma.contact.findUnique({
      where: { waId },
    });

    if (existing) {
      if (name && existing.name !== name) {
        const updated = await this.prisma.contact.update({
          where: { id: existing.id },
          data: { name },
        });
        return { contact: updated, created: false };
      }

      return { contact: existing, created: false };
    }

    try {
      const created = await this.prisma.contact.create({
        data: {
          waId,
          name: name ?? null,
          type: "unknown",
        },
      });

      return { contact: created, created: true };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const recovered = await this.prisma.contact.findUnique({
          where: { waId },
        });
        if (!recovered) {
          throw new Error(
            `Contact recovery failed after duplicate key for waId=${waId}`
          );
        }
        return { contact: recovered, created: false };
      }
      throw error;
    }
  }

  async updateType(contactId: string, type: ContactType): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        type,
        ...(type === "unknown"
          ? {}
          : {
              disambiguationAskedAt: null,
            }),
      },
    });
  }

  async markDisambiguationAsked(contactId: string): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        disambiguationAskedAt: new Date(),
      },
    });
  }
}
