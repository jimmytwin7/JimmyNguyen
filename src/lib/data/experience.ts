export interface Role {
  /** Job title held at the company */
  title: string;
  /** ISO 8601 date string, e.g. "2021-06" */
  startDate: string;
  /** ISO 8601 date string or "present" */
  endDate: string | "present";
  /** Bullet points describing responsibilities / achievements */
  bullets: string[];
}

export interface Company {
  name: string;
  /** Optional: location string, e.g. "Minneapolis, MN" */
  location?: string;
  /** Roles held at this company, listed most recent first */
  roles: Role[];
}

export const experience: Company[] = [
  {
    name: "Ameriprise Financial",
    location: "Minneapolis, MN",
    roles: [
      {
        title: "Software Engineer",
        startDate: "2026-08",
        endDate: "present",
        bullets: [
          "Lead end-to-end software releases, coordinating development, QA, deployment, and production rollout",
        ],
      },
      {
        title: "Programmer Analyst II",
        startDate: "2024-01",
        endDate: "2026-07",
        bullets: [
          "Enhanced performance and user experience by migrating Columbia Threadneedle's public-facing website to a React-based SPA integrated with Bloomreach's headless CMS",
          "Improved accessibility scores by 12%, leading end-to-end accessibility initiatives from ticket creation to production rollout",
          "Spearheaded mobile OTP authentication, integrating backend services to deliver secure and seamless login flows",
          "Served as the go-to developer for QA leads, configuring and debugging Cypress test automation with Docker, Jenkins, and Artifactory, which strengthened pre-deployment testing across 12 suites",
        ],
      },
      {
        title: "Cloud/Data Engineer LDP",
        startDate: "2023-12",
        endDate: "present",
        bullets: [
          "Deployed a function within AWS Lambda that automated the teams daily ingestion of 7,000,000 records into the database in a near real-time fashion, utilizing both Amazon S3 and Amazon Athena in conjunction",
        ],
      },
      {
        title: "Software Architect/Developer LDP",
        startDate: "2023-12",
        endDate: "present",
        bullets: [
          "Partnered with architecture to design and develop an integration between data lake and application API to load engagement data as research notes, lead development of the interface from requirements through functional testing and successfully handing off to BAU team.",
          "Implemented and tested notification features for Columbia Threadneedles file storage and transfers platform, employing Amazon SNS, Amazon SQS, and AWS Lambda to enable an auditable and reliable service under the .NET framework",
          "Utilized Open Policy Agent, JWT, and REST API principles to implement a secure authorization pattern for the organization's file storage and transfer platform",
        ],
      },
      {
        title: "Platform Engineer LDP",
        startDate: "2023-12",
        endDate: "present",
        bullets: [
          "Performed migration of twenty applications from being hosted OnPrem to Amazon EKS",
          "Directed two of sixteen product team releases from OnPrem to AWS, making use of Sumo Logic for monitoring and Postman for validations",
          "Completed POC of LaunchDarkly integration with the team's routing to allow for zero downtime between old and new deployments.",
          "Maintained a self service utility through Jenkins, used by developers to update Kubernetes resources hosted on AWS.",
        ],
      },
    ],
  },
  {
    name: "Pearson VUE",
    location: "Remote",
    roles: [
      {
        title: "Software Engineer Intern",
        startDate: "2021-05",
        endDate: "2021-08",
        bullets: [
          "Delivered 35+ front-end stories for the organization's automated email configuration application built upon the Angular framework.",
        ],
      },
    ],
  },
];
