export interface Project {
  name: string;
  /** Max 200 characters */
  description: string;
  /** 1–5 technology tags, e.g. ["TypeScript", "Next.js", "Tailwind"] */
  tags: [string, ...string[]] & { length: 1 | 2 | 3 | 4 | 5 };
  /** Optional URL to a live demo */
  demoUrl?: string;
  /** Optional URL to source code repository */
  repoUrl?: string;
}

export const projects: Project[] = [
  {
    name: 'Portfolio Website',
    description:
      'Personal portfolio site built with Next.js, TypeScript, and Tailwind CSS. Features a responsive layout, travel gallery, and projects showcase.',
    tags: ['TypeScript', 'Next.js', 'Tailwind CSS'] as unknown as Project['tags'],
    demoUrl: 'https://jimmynguyen.dev',
    repoUrl: 'https://github.com/jimmynguyen/portfolio',
  },
  {
    name: 'Task Manager API',
    description:
      'RESTful API built with Node.js and Express for managing tasks and projects. Includes JWT authentication and PostgreSQL persistence.',
    tags: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'] as unknown as Project['tags'],
    repoUrl: 'https://github.com/jimmynguyen/task-manager-api',
  },
  {
    name: 'Weather Dashboard',
    description:
      'Interactive weather dashboard that visualizes forecast data from the OpenWeather API with dynamic charts and location search.',
    tags: ['React', 'TypeScript', 'Chart.js'] as unknown as Project['tags'],
    demoUrl: 'https://weather.jimmynguyen.dev',
    repoUrl: 'https://github.com/jimmynguyen/weather-dashboard',
  },
  {
    name: 'CLI File Organizer',
    description:
      'Command-line tool written in Python that automatically sorts files into categorized folders based on file type and creation date.',
    tags: ['Python'] as unknown as Project['tags'],
    repoUrl: 'https://github.com/jimmynguyen/file-organizer',
  },
  {
    name: 'E-Commerce Storefront',
    description:
      'Full-stack e-commerce application with product catalog, cart functionality, and Stripe payment integration.',
    tags: ['Next.js', 'TypeScript', 'Stripe', 'Prisma', 'PostgreSQL'] as unknown as Project['tags'],
    demoUrl: 'https://shop.jimmynguyen.dev',
    repoUrl: 'https://github.com/jimmynguyen/ecommerce',
  },
] as Project[];
