/**
 * WhatsApp copy for cold outreach.
 *
 * Deliberately kept in a dependency-free module so the dashboard (client) and
 * the outreach generator (server) share exactly the same words.
 *
 * Principles learned the hard way:
 * - The first touch is ONE short human question. No link, no image, no emoji,
 *   no "FREE", no pitch. A link/attachment in message one is the strongest
 *   signal WhatsApp and the recipient use to classify you as spam.
 * - The demo link is only sent after the prospect replies.
 * - One polite nudge, then stop.
 */

export type WhatsAppFirstTouchInput = {
  businessName: string;
  city?: string;
  profession?: string;
  hasWebsite: boolean;
};

function stableHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Deterministically picks one of several first-touch openers for a business.
 * Varying the opener matters: identical text sent to many people is the
 * strongest spam signal WhatsApp uses. The same business always gets the same
 * opener (stable across regenerations), but different businesses differ.
 */
export function buildWhatsAppFirstTouch(input: WhatsAppFirstTouchInput): string {
  const businessName = (input.businessName || 'your business').trim();
  const city = (input.city || 'your area').trim();
  const trade = (input.profession || 'local service').trim().toLowerCase();

  const noWebsiteOpeners = [
    `Hi, is this the team at ${businessName}? I'm Puneet from ${city} — I was looking at ${trade} businesses nearby and didn't see a website for you. Is that intentional, or just something you haven't got to yet?`,
    `Hi — quick question for whoever runs ${businessName}. I'm Puneet from ${city}. I couldn't find a website for your ${trade} business. Is that by choice, or have you just not set one up yet?`,
    `Hi, is this ${businessName}? I'm Puneet, I work with ${trade} businesses in ${city}. Noticed there's no website listed for you — is that something you've been meaning to sort, or not a priority right now?`,
    `Hi, is this the owner of ${businessName}? My name is Puneet, I'm based in ${city}. I was searching for ${trade} services and noticed you don't have a website. Is that by design, or just hasn't happened yet?`,
  ];

  const hasWebsiteOpeners = [
    `Hi, is this the team at ${businessName}? I'm Puneet from ${city} — I had a quick look at your website. Is it okay if I share one small observation about how it looks on a phone?`,
    `Hi — is this ${businessName}? I'm Puneet from ${city}. I came across your site while looking at ${trade} businesses nearby. Would it be okay to share one quick observation about the mobile view?`,
    `Hi, is this the owner of ${businessName}? I'm Puneet, based in ${city}. I took a look at your website — can I share one observation about how it shows up on mobile?`,
  ];

  const pool = input.hasWebsite ? hasWebsiteOpeners : noWebsiteOpeners;
  return pool[stableHash(businessName.toLowerCase()) % pool.length];
}

/**
 * Sent only AFTER the prospect replies. This is what carries the demo link.
 */
export function buildWhatsAppReplyFollowUp(input: {
  businessName: string;
  demoUrl: string;
}): string {
  return `Thanks for getting back to me. Here's the quick mockup I mentioned for ${input.businessName}:

${input.demoUrl}

It's just a concept — nothing is live yet. Have a look and tell me if it's close to what you'd want. If it's not for you, just say so and I'll leave it there.`;
}

/**
 * A single, polite nudge for people who read but never replied. Send once,
 * two to three days later, then stop.
 */
export function buildWhatsAppNoReplyFollowUp(input: { businessName: string }): string {
  return `Hi, just following up on my message about ${input.businessName}. If a website isn't a priority right now, no problem at all — just reply "no" and I won't message again.`;
}
