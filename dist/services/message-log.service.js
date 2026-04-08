export class MessageLogService {
    prisma;
    constructor({ prisma }) {
        this.prisma = prisma;
    }
    async logInbound(contactId, message) {
        return this.prisma.messageLog.create({
            data: {
                contactId,
                direction: "inbound",
                content: message.text,
                messageType: message.type,
                waMessageId: message.messageId,
                metadata: {
                    timestamp: message.timestamp,
                },
            },
        });
    }
    async logOutbound(contactId, content, waMessageId, metadata = {}) {
        return this.prisma.messageLog.create({
            data: {
                contactId,
                direction: "outbound",
                content,
                messageType: "text",
                waMessageId: waMessageId ?? null,
                metadata,
            },
        });
    }
    async countInboundForContact(contactId) {
        return this.prisma.messageLog.count({
            where: {
                contactId,
                direction: "inbound",
            },
        });
    }
}
