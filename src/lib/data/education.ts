export interface Education {
  institution: string;
  degree: string;
  /** Four-digit year, e.g. 2019 */
  graduationYear: number;
  /** Optional field of study / major */
  fieldOfStudy?: string;
  /** Optional path to the institution logo, relative to /public */
  logo?: string;
}

export const education: Education[] = [
  {
    institution: "University of Minnesota - Twin Cities",
    degree: "Bachelor of Science",
    graduationYear: 2022,
    fieldOfStudy: "Computer Science",
    logo: "/umn.png",
  },
];
