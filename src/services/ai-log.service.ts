import {
  type AILog,
  type ContactType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

interface LogClassificationInput {
  contactId: string;
  model: string;
  input: string;
  output: string;
  classification: ContactType;
  confidence: number | null;
  metadata?: Record<string, unknown>;
}

interface LogReplyInput {
  contactId: string;
  model: string;
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
}

export class AILogService {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async logClassification({
    contactId,
    model,
    input,
    output,
    classification,
    confidence,
    metadata = {},
  }: LogClassificationInput): Promise<AILog> {
    return this.prisma.aILog.create({
      data: {
        contactId,
        kind: "classification",
        model,
        input,
        output,
        classification,
        confidence,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async logReply({
    contactId,
    model,
    input,
    output,
    metadata = {},
  }: LogReplyInput): Promise<AILog> {
    return this.prisma.aILog.create({
      data: {
        contactId,
        kind: "reply",
        model,
        input,
        output,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
