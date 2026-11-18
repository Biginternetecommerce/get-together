/**
 * CENTRAL CONTENT + EVENT CONFIG.
 * Edit this file only - no animation code needs to change.
 * Anything marked TBC is a placeholder until the family confirms details.
 */
export const invitation = {
  child: { firstName: "Aurora", fullName: "Aurora Faye Britto" },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://aurorafayebritto.com",
  copy: {
    envelopeLine: "A little magic awaits beneath the waves...",
    envelopeCta: "Open Aurora's Invitation",
    revealKicker: "A Sea of Blessings for",
    revealTagline: "A magical gathering filled with love, laughter and little wonders.",
    meetTitle: "Meet Our Little Ocean Princess",
    inviteTitle: "You're Invited!",
    inviteBody: "Join us for a special gathering to meet little Aurora and shower her with your love and blessings.",
    thankYou: "Thank You for Being Part of Aurora's World!",
  },
  event: {
    title: "A Sea of Blessings for Aurora",
    // ISO local start e.g. "2026-09-06T15:00:00" - leave null until confirmed (enables Add to Calendar)
    startIso: "2027-03-14T15:00:00" as string | null,
    durationHours: 3,
    dateText: "Sunday, March 14, 2027",
    timeText: "3:00 PM - 6:00 PM",
    venue: "Coral Bay Garden Hall",
    address: "12 Seashell Lane, Marina Bay",
    // Used for Get Directions. Leave "" until confirmed.
    mapsQuery: "Coral Bay Garden Hall, 12 Seashell Lane, Marina Bay",
  },
  dressCode: {
    enabled: true, // set false to hide the whole scene
    optional: true,
    title: "Dress for a Splash of Fun!",
    subtitle: "Ocean colours in pastel blue, pink, lavender and pearls.",
  },
  meet: {
    // Set false to hide Aurora's photos entirely (privacy switch).
    photosEnabled: true,
    // Add files to /public/photos and list them here, e.g. { src: "/photos/aurora-1.webp", alt: "Aurora smiling" }
    // First photo is the hero (opens in the pearl shell); the next two float beside it. `pos` = CSS object-position crop.
    photos: [
      { src: "/photos/IMG_2299.webp", alt: "Aurora peeking over her mother's shoulder in a white lace bow", pos: "42% 48%" },
      { src: "/photos/IMG_2419.webp", alt: "Aurora with her mum and dad", pos: "45% 55%" },
      { src: "/photos/IMG_2470.webp", alt: "Aurora with her family in front of a pink balloon backdrop", pos: "50% 40%" },
    ] as { src: string; alt: string; pos?: string }[],
    // Editable family message - replace with the family's own words.
    familyMessage: "Our little pearl has made our world so much brighter. We would be so happy to celebrate her with the people we love most - come share a day of laughter, cake and ocean magic with us!",
  },
  rsvp: { enabled: true, deadlineText: "" },
  guestbook: { enabled: true },
  // After the event: set to a gallery URL to show a link in the thank-you scene.
  memoriesUrl: "" as string,
};
export type Invitation = typeof invitation;
