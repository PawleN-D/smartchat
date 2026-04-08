import {
  Prisma,
  type MessageLog,
  type PrismaClient,
} from "@prisma/client";
import type { NormalizedInboundMessage } from "../types/webhook.js";
import { sanitizeRawObject } from "../utils/normalizers.js";

export type InboundLogResult =
  | {
      status: "created";
      record: MessageLog;
    }
  | {
      status: "duplicate";
      waMessageId: string;
    };

export class MessageLogService {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async logInbound(
    contactId: string,
    message: NormalizedInboundMessage
  ): Promise<InboundLogResult> {
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
          } as Prisma.InputJsonValue,
        },
      });

      return {
        status: "created",
        record,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        message.messageId
      ) {
        return {
          status: "duplicate",
          waMessageId: message.messageId,
        };
      }

      throw error;
    }
  }

  async logOutbound(
    contactId: string,
    content: string,
    waMessageId: string | null,
    metadata: Record<string, unknown> = {}
  ): Promise<MessageLog> {
    return this.prisma.messageLog.create({
      data: {
        contactId,
        direction: "outbound",
        content,
        messageType: "text",
        waMessageId: waMessageId ?? null,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async countInboundForContact(contactId: string): Promise<number> {
    return this.prisma.messageLog.count({
      where: {
        contactId,
        direction: "inbound",
      },
    });
  }
}
