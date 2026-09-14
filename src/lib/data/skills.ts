export interface Skill {
  name: string;
}

export interface SkillCategory {
  /** Category label, e.g. "Languages", "Frameworks", "Tools" */
  label: string;
  skills: Skill[];
}

export const skillCategories: SkillCategory[] = [
  {
    label: 'Languages',
    skills: [
      { name: 'TypeScript' },
      { name: 'JavaScript' },
      { name: 'HTML' },
      { name: 'CSS' },
      { name: 'Python' },
      { name: 'C#' },
      { name: 'C' },
      { name: 'Java' },
      { name: 'Rego' },
      { name: 'Groovy' },
    ],
  },
  {
    label: 'Frameworks & Libraries',
    skills: [
      { name: 'React' },
      { name: 'Next.js' },
      { name: 'Angular' },
      { name: 'Jenkins' },
      { name: '.NET' },
      { name: 'Postman' },
      { name: 'REST API' },
      { name: 'Headless CMS' },
      { name: 'Git' },
      { name: 'Docker' },
      { name: 'Kubernetes' },
      { name: 'Maven' },
    ],
  },
  {
    label: 'Cloud Services',
    skills: [
      { name: 'AWS Lambda' },
      { name: 'Amazon SNS' },
      { name: 'Amazon SQS' },
      { name: 'Amazon Athena' },
      { name: 'Amazon S3' },
      { name: 'Amazon EKS' },
    ],
  },{
    label: 'Soft Skills',
    skills: [
      { name: 'Communication' },
      { name: 'Collaboration' },
      { name: 'Creativity/Design' },
      { name: 'Empathy' },
      { name: 'Time Management' },
      { name: 'Ownership' },
      { name: 'Leadership' },
    ],
  },
];
