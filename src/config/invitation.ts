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
    startIso: "2026-12-29T12:00:00" as string | null,
    durationHours: 3,
    dateText: "Tuesday, 29 December 2026",
    timeText: "12:00 PM",
    venue: "The North Avenue",
    address: "Mysore",
    // Used for Get Directions. Leave "" until confirmed.
    mapsQuery: "The North Avenue, Mysore",
    // Exact Google Maps place link (used by every Directions / Open in Maps button)
    mapsUrl: "https://maps.google.com/maps/place//data=!4m2!3m1!1s0x3baf7bb54f528d11:0xb04bbcef819ef9bb?entry=s&sa=X&ved=2ahUKEwjystq-tpSYAxUVluEIHdmBCmAQ4kB6BAgVEAA&hl=en",
  },
  /** Mobile invitation page (src/components/Invite.tsx) - text exactly as on the invitation card. */
  invite: {
    video: "/media/envelope.mp4", // 9:16 envelope opening; its last frame (clean reef) stays as the page background
    loop: "/media/reef-loop.mp4", // seamless 2s reef clip that loops behind the card (starts exactly where the envelope video ends)
    poster: "/media/poster.jpg",
    // 16:9 version for desktop / landscape screens (same music)
    desktop: { video: "/media/desktop-envelope.mp4", loop: "/media/desktop-reef-loop.mp4", poster: "/media/desktop-poster.jpg" },
    music: "/media/music.m4a",    // soundtrack from the original video; starts on tap, loops
    kicker: "A LITTLE PEARL OF JOY",
    celebrating: "Celebrating",
    subtitle: "Our little ocean of happiness",
    headline: "A little celebration, a lifetime of blessings...",
    body: "With hearts full of love, we invite you to join us as we celebrate our precious Aurora and shower her with your love, prayers and blessings.",
    dateLine1: "Tuesday,",
    dateLine2: "29 December 2026",
    time: "12:00 PM",
    venueLine1: "The North Avenue,",
    venueLine2: "Mysore",
    dressTitle: "Dress in a Splash of Ocean Pastels",
    dressColors: "Blush Pink · Ocean Blue · Mint Green · Butter Yellow · Lavender · Pearl White",
    wish: "A little wish, a little prayer, a lifetime of love.",
    wait: "We cannot wait to celebrate this precious day with you!",
    withLove: "With love,",
    signoff: "Sharon & John",
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
  contacts: [
    { name: "John", phone: "8971388990" },
    { name: "Sharon", phone: "9449322702" },
  ],
  rsvp: { enabled: true, deadlineText: "Please RSVP by 20th December 2026" },
  guestbook: { enabled: true },
  // After the event: set to a gallery URL to show a link in the thank-you scene.
  memoriesUrl: "" as string,
};
export type Invitation = typeof invitation;
