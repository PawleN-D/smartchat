import { Prisma, } from "@prisma/client";
import { sanitizeRawObject } from "../utils/normalizers.js";
export class MessageLogService {
    prisma;
    constructor({ prisma }) {
        this.prisma = prisma;
    }
    async logInbound(contactId, message) {
        try {
            const record = await this.prisma.messageLog.create({
                data: {
                    contactId,
                    direction: "inbound",
                    content: message.text,
                    messageType: message.type,
                    waMessageId: message.messageId,
                    metadata: {
                        timestamp: message.timestamp,
                        normalized: {
                            messageId: message.messageId,
                            waId: message.waId,
                            name: message.name,
                            type: message.type,
                            text: message.text,
                        },
                        raw: sanitizeRawObject(message.raw),
                    },
                },
            });
            return {
                status: "created",
                record,
            };
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002" &&
                message.messageId) {
                return {
                    status: "duplicate",
                    waMessageId: message.messageId,
                };
            }
            throw error;
        }
    }
    async logOutbound(contactId, content, waMessageId, metadata = {}) {
        return this.prisma.messageLog.create({
            data: {
                contactId,
                direction: "outbound",
                content,
                messageType: "text",
                waMessageId: waMessageId ?? null,
                metadata: metadata,
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
