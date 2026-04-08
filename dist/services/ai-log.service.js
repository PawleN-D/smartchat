export class AILogService {
    prisma;
    constructor({ prisma }) {
        this.prisma = prisma;
    }
    async logClassification({ contactId, model, input, output, classification, confidence, metadata = {}, }) {
        return this.prisma.aILog.create({
            data: {
                contactId,
                kind: "classification",
                model,
                input,
                output,
                classification,
                confidence,
                metadata: metadata,
            },
        });
    }
    async logReply({ contactId, model, input, output, metadata = {}, }) {
        return this.prisma.aILog.create({
            data: {
                contactId,
                kind: "reply",
                model,
                input,
                output,
                metadata: metadata,
            },
        });
    }
}
