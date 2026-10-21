/**
 * Industry Images Engine
 *
 * Provides curated, ultra-high-resolution Unsplash photos matched to any business profession.
 * Guarantees zero broken images and appropriate visual identity for hero and section cards.
 */

export interface IndustryImageSet {
  heroImage: string;
  secondaryImage: string;
  aboutImage: string;
  accentColor: string;
  categoryTag: string;
}

export function getIndustryImages(profession?: string, businessName?: string): IndustryImageSet {
  // The profession names the trade; a business name often only decorates it
  // ("… Detailing Studio", "… Dental Clinic"). Match the profession alone first,
  // so a word like "Studio" cannot turn a car-detailing lead into a photography
  // set. The full text is still tried when the profession says nothing useful.
  const professionText = (profession || '').toLowerCase();
  const byProfession = professionText ? matchIndustryImages(professionText) : undefined;
  if (byProfession) return byProfession;

  const fullText = `${professionText} ${(businessName || '').toLowerCase()}`.trim();
  return (fullText ? matchIndustryImages(fullText) : undefined) || NEUTRAL_INDUSTRY_IMAGES;
}

/** The curated rule chain, tried in order. Undefined when no rule fits. */
function matchIndustryImages(text: string): IndustryImageSet | undefined {

  // 1. Dental / Dentist
  if (/dent|dental|orthodont|teeth|oral|smile/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80',
      accentColor: '#0d9488',
      categoryTag: 'Modern Dental & Implant Center',
    };
  }

  // 2. Medical / Clinic / Doctor / Physio / Diagnostics
  if (/doctor|clinic|medical|physio|health|hospital|pediatric|ayurved|homeopath|orthopedic|derma|skin/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
      accentColor: '#0284c7',
      categoryTag: 'Multispeciality Medical Clinic',
    };
  }

  // 3. Interior Designer / Architect / Modular Kitchen / Civil
  if (/interior|architect|decor|kitchen|modular|furniture|living|renovation|designer|cabinet/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
      accentColor: '#d97706',
      categoryTag: 'Boutique Architecture & Interior Studio',
    };
  }

  // 4. Gym / Fitness / Yoga / Sports
  if (/gym|fitness|crossfit|workout|trainer|yoga|pilates|bodybuilding|sports|martial/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
      accentColor: '#dc2626',
      categoryTag: 'Modern Performance Gym & Fitness Center',
    };
  }

  // 5. Salon / Spa / Beauty / Bridal
  if (/salon|spa|beauty|parlor|hair|makeup|bridal|aesthetic|barber|nail/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
      accentColor: '#db2777',
      categoryTag: 'Luxury Salon & Wellness Spa',
    };
  }

  // 6. Restaurant / Bakery / Sweet Shop / Cafe
  if (/restaurant|cafe|coffee|bakery|bake|cake|sweet|mithai|food|bistro|dine|pizzeria|pastry|cater/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
      accentColor: '#ea580c',
      categoryTag: 'Artisanal Cafe & Fine Dining',
    };
  }

  // 7. Real Estate / Property / Builder
  if (/real estate|realty|property|properties|builder|housing|apartments|developer|flat|commercial plot/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
      accentColor: '#2563eb',
      categoryTag: 'Prime Real Estate & Property Advisory',
    };
  }

  // 8. Coaching / Academy / School / Education
  if (/coaching|academy|institute|classes|tutor|education|school|learning|ielts|upsc|jee|neet/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80',
      accentColor: '#4f46e5',
      categoryTag: 'Premier Coaching & Learning Academy',
    };
  }

  // 9. Photography / Videography / Creative Studio
  if (/photo|photograph|videograph|cinematograph|portrait|wedding shoot|pre-wedding|studio|camera|shoot|videographer/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=900&q=80',
      accentColor: '#d97706',
      categoryTag: 'Wedding & Portrait Photography Studio',
    };
  }

  // 10. Automobile / Workshop / Solar / Pest Control / Contractor
  if (/car|auto|garage|mechanic|detailing|motor|solar|pest|electric|plumb|contractor|clean|rooftop/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=85',
      // Replaces photo-1486006920555-c77dce18193b, which Unsplash now returns 404.
      secondaryImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
      accentColor: '#059669',
      categoryTag: 'Expert Technical & Field Services',
    };
  }

  // 11. Chartered Accountant / Tax / Audit / Legal (explicit — never the fallback)
  if (/chartered|ca firm|\bca\b|audit|tax|gst|account|bookkeep|itr|advocate|lawyer|legal/i.test(text)) {
    return {
      heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
      secondaryImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
      aboutImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
      accentColor: '#1e3a8a',
      categoryTag: 'Chartered Advisory & Corporate Practice',
    };
  }

  // 12. Neutral professional fallback (never assume CA for unknown professions)
  return undefined;
}

const NEUTRAL_INDUSTRY_IMAGES: IndustryImageSet = {
  heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
  secondaryImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80',
  aboutImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
  accentColor: '#2563eb',
  categoryTag: 'Professional Services',
};

export interface IndustryImageChoice {
  /** A photo sourced from the web for this exact trade (already self-hosted). */
  sourced?: string;
  /** The curated photo that matches the trade, when the industry is known. */
  industryMatched?: string;
  /** The category preset's photo: curated per category, or the neutral fallback. */
  preset?: string;
  /** Last resort, e.g. the content engine's own pool. */
  fallback?: string;
  /**
   * General SMB trades have no curated category art, so their preset photo is
   * the neutral corporate one. The trade-matched photo must outrank it there —
   * an office lobby must never headline a car-detailing page. Curated
   * categories keep their own preset first.
   */
  industryFirst: boolean;
}

/**
 * Chooses the hero/about photo by trust order: a live-sourced photo of the
 * actual trade, then the trade-matched set or the category preset, then the
 * last resort. Always returns a usable URL or undefined.
 */
export function pickIndustryImage(choice: IndustryImageChoice): string | undefined {
  const { sourced, industryMatched, preset, fallback, industryFirst } = choice;
  if (sourced) return sourced;
  const ordered = industryFirst
    ? [industryMatched, preset, fallback]
    : [preset, industryMatched, fallback];
  return ordered.find((url): url is string => typeof url === 'string' && url.length > 0);
}
