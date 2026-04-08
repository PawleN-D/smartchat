export interface WhatsAppContact {
  wa_id?: string;
  profile?: { name?: string };
}

export interface WhatsAppInboundMessage extends Record<string, unknown> {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: { caption?: string };
  video?: { caption?: string };
}

export interface WhatsAppChangeValue extends Record<string, unknown> {
  contacts?: WhatsAppContact[];
  messages?: WhatsAppInboundMessage[];
}

export interface WhatsAppWebhookChange extends Record<string, unknown> {
  value?: WhatsAppChangeValue;
}

export interface WhatsAppWebhookEntry extends Record<string, unknown> {
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload extends Record<string, unknown> {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface NormalizedInboundMessage {
  messageId: string | null;
  waId: string;
  name: string | null;
  timestamp: string | null;
  type: string;
  text: string;
  raw: Record<string, unknown>;
}
