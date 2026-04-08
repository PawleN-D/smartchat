export class ContactService {
    prisma;
    constructor({ prisma }) {
        this.prisma = prisma;
    }
    async getOrCreate({ waId, name }) {
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
        }
        catch (error) {
            if (error?.code === "P2002") {
                const recovered = await this.prisma.contact.findUnique({
                    where: { waId },
                });
                return { contact: recovered, created: false };
            }
            throw error;
        }
    }
    async updateType(contactId, type) {
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
    async markDisambiguationAsked(contactId) {
        return this.prisma.contact.update({
            where: { id: contactId },
            data: {
                disambiguationAskedAt: new Date(),
            },
        });
    }
}
