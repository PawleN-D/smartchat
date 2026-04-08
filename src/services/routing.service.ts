export const RouteAction = Object.freeze({
  SILENCE: "silence",
  ASK_DISAMBIGUATION: "ask_disambiguation",
  RESPOND_AI: "respond_ai",
});

export class RoutingService {
  resolve(contact) {
    if (contact.type === "personal") {
      return RouteAction.SILENCE;
    }

    if (contact.type === "business") {
      return RouteAction.RESPOND_AI;
    }

    if (contact.type === "unknown" && !contact.disambiguationAskedAt) {
      return RouteAction.ASK_DISAMBIGUATION;
    }

    return RouteAction.SILENCE;
  }
}
