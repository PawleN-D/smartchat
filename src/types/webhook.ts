export interface WhatsAppProfile {
  name?: string;
}

export interface WhatsAppContact {
  wa_id?: string;
  profile?: WhatsAppProfile;
}

export interface WhatsAppTextContent {
  body?: string;
}

export interface WhatsAppInteractiveReply {
  title?: string;
}

export interface WhatsAppInteractiveContent {
  button_reply?: WhatsAppInteractiveReply;
  list_reply?: WhatsAppInteractiveReply;
}

export interface WhatsAppMediaContent {
  caption?: string;
}

export interface WhatsAppInboundMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: WhatsAppTextContent;
  interactive?: WhatsAppInteractiveContent;
  image?: WhatsAppMediaContent;
  video?: WhatsAppMediaContent;
  [key: string]: unknown;
}

export interface WhatsAppChangeValue {
  contacts?: WhatsAppContact[];
  messages?: WhatsAppInboundMessage[];
  [key: string]: unknown;
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppChangeValue;
  [key: string]: unknown;
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
  [key: string]: unknown;
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
  [key: string]: unknown;
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
