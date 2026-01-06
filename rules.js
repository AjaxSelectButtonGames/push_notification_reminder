// rules.js
// Deterministic, local, explainable rules engine

export const DECISIONS = {
  ALLOW: "allow",
  HOLD: "hold",
  FLAG: "flag"
};

function enrichContext(notification, history) {
  const date = new Date(notification.timestamp);
  const hour = date.getHours();

  const similar = history.filter(n =>
    n.domain === notification.domain &&
    n.title === notification.title
  );

  const previouslyIgnored = similar.filter(n => n.read === false).length;
  const previouslyOpened = similar.filter(n => n.read === true).length;

  return {
    domain: notification.domain,
    title: notification.title,
    message: notification.message,
    timestamp: notification.timestamp,

    hour,
    isWorkHours: hour >= 9 && hour <= 17,

    repeatCount: similar.length,
    previouslyIgnored,
    previouslyOpened
  };
}

const rules = [

  // High-frequency noise
  (ctx) => {
    if (ctx.repeatCount >= 5 && ctx.previouslyIgnored >= 3) {
      return {
        decision: DECISIONS.HOLD,
        reason: "You usually ignore notifications like this."
      };
    }
    return null;
  },

  // Engagement signal
  (ctx) => {
    if (ctx.previouslyOpened >= 3) {
      return {
        decision: DECISIONS.FLAG,
        reason: "You usually open notifications like this."
      };
    }
    return null;
  },

  // Off-hours protection
  (ctx) => {
    if (!ctx.isWorkHours && ctx.repeatCount >= 2) {
      return {
        decision: DECISIONS.HOLD,
        reason: "This arrived outside your usual active hours."
      };
    }
    return null;
  }

];

function defaultDecision() {
  return {
    decision: DECISIONS.ALLOW,
    reason: "No reason to delay this."
  };
}

export function evaluateNotification(notification, history = []) {
  const ctx = enrichContext(notification, history);

  for (const rule of rules) {
    const result = rule(ctx);
    if (result) return result;
  }

  return defaultDecision();
}
