export interface Destination {
  /** Display name of the location, e.g. "Tokyo, Japan" */
  name: string;
  /** Max 300 characters */
  description: string;
  /**
   * Path relative to /public/images/destinations/, e.g. "tokyo.jpg"
   * If null, a placeholder is rendered instead.
   */
  imagePath: string | null;
  /** Alt text for the image; required when imagePath is non-null */
  imageAlt?: string;
}

export const destinations: Destination[] = [
  {
    name: 'Seattle, Washington',
    description:
      'A mesmerizing blend of ultra-modern and traditional, Tokyo offers incredible food, efficient transit, and neighborhoods ranging from serene temples to neon-lit entertainment districts.',
    imagePath: 'tokyo.jpg',
    imageAlt: 'Tokyo skyline at dusk with Mount Fuji visible in the background',
  },
  {
    name: 'Vietnam',
    description:
      'Perched on seven hills overlooking the Tagus river, Lisbon charms visitors with its pastel-colored buildings, tram rides, and the melancholic beauty of fado music in candlelit tavernas.',
    imagePath: null,
  },
  {
    name: 'Banff National Park',
    description:
      'The cultural heart of Japan, Kyoto is home to over a thousand temples, traditional tea houses, and the iconic bamboo groves of Arashiyama.',
    imagePath: 'kyoto.jpg',
    imageAlt: 'Torii gates lining the path through Fushimi Inari shrine in Kyoto',
  },
  {
    name: 'Southwest USA',
    description:
      'The city that never sleeps — from Central Park to the Brooklyn Bridge, NYC pulses with energy, diversity, and world-class art, food, and culture around every corner.',
    imagePath: null,
  },
];
