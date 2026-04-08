# WhatsApp AI CRM MVP (Fastify + OpenAI + Prisma)

Production-ready MVP backend for a WhatsApp AI CRM with:
- Fastify webhook ingestion
- OpenAI-based contact classification + reply generation
- Contact routing (`business` vs `personal` vs `unknown`)
- Prisma ORM with PostgreSQL
- Docker deployment for Render

## 1) Folder Structure

```text
.
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- Dockerfile
|-- package.json
|-- prisma
|   `-- schema.prisma
`-- src
    |-- app.ts
    |-- container.ts
    |-- index.ts
    |-- config
    |   |-- env.ts
    |   `-- prompts.ts
    |-- controllers
    |   `-- webhook.controller.ts
    |-- db
    |   `-- prisma.ts
    |-- routes
    |   |-- health.routes.ts
    |   `-- webhook.routes.ts
    |-- services
    |   |-- ai-log.service.ts
    |   |-- classification.service.ts
    |   |-- contact.service.ts
    |   |-- message-log.service.ts
    |   |-- openai.service.ts
    |   |-- routing.service.ts
    |   |-- session.service.ts
    |   |-- webhook.service.ts
    |   `-- whatsapp.service.ts
    `-- utils
        |-- classification-helpers.ts
        |-- errors.ts
        |-- normalizers.ts
        `-- retry.ts
```

## 2) Environment Variables

Copy `.env.example` to `.env` and set:

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`

## 3) Local Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
npm run build
npm start
```

Health endpoint:

```bash
curl http://localhost:3000/health
```

## 4) Webhook Endpoints

- `GET /webhook` for WhatsApp verification handshake
- `POST /webhook` for inbound message events

Verification query params expected by Meta:
- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

## 5) Message Classification + Routing

Rules implemented:
- New contact starts as `unknown`.
- Greeting-only first message (`"hi"`, `"hello"`, etc.) stays `unknown`.
- OpenAI classifies intent (`business`, `personal`, `unknown`) with keyword context.
- `personal` => silence (no auto reply)
- `business` => AI reply generated and sent
- `unknown` (first unresolved) => send disambiguation question once
- Next unknown-contact message is re-classified; if still unknown, remain silent

Disambiguation message:

`Hi! Are you contacting us about something we can help with regarding our business/services?`

## 6) Render Deployment (Docker)

1. Push this project to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Select **Docker** environment.
4. Set environment variables from `.env.example`.
5. Set `PORT=3000` (Render routes traffic to this).
6. Add a one-time or release command for migrations:

```bash
npx prisma migrate deploy
```

7. After deploy, set Meta webhook URL to:

```text
https://<your-render-service>.onrender.com/webhook
```

8. In Meta developer portal, set verify token to match `WHATSAPP_VERIFY_TOKEN`.

## 7) Prisma Migration Commands

Development:

```bash
npx prisma migrate dev --name init
```

Production/Render:

```bash
npx prisma migrate deploy
```

## 8) Postman Test Payload (Webhook POST)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "27123456789",
              "phone_number_id": "123456789012345"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Jane Doe"
                },
                "wa_id": "27831234567"
              }
            ],
            "messages": [
              {
                "from": "27831234567",
                "id": "wamid.HBgM...",
                "timestamp": "1712321000",
                "type": "text",
                "text": {
                  "body": "Hi, can I get a quote for your cleaning service?"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 9) Test Classification Examples

1. First message: `"Hi"`  
Result: `unknown` (greeting-only first message)

2. Next message: `"I need pricing for monthly office cleaning"`  
Result: `business` (keywords + OpenAI intent)

3. Message: `"Hey cousin, are we still meeting tonight?"`  
Result: `personal` (social intent, no business context)
