export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  name: string;
  category: 'Technical' | 'Soft' | 'Domain' | 'Tool';
  level: SkillLevel;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  academicLevel: 'Undergraduate' | 'Graduate';
  department: string;
  university: string;
  researchInterests: string[];
  skills: Skill[];
  projectPreferences: ('Thesis' | 'Research' | 'Product' | 'Industry')[];
  availability: 'Part-time' | 'Full-time';
  collaborationPreference: 'Leader' | 'Co-author' | 'Contributor';
  thesisPhase?: 'Proposal' | 'Research' | 'Development' | 'Writing' | 'Submission';
}

export interface TeamRecommendation {
  id: string; // Unique ID for this specific recommendation instance
  targetUser: StudentProfile; // The user looking for a team
  recommendedTeammates: StudentProfile[];
  compatibilityScore: number; // 0-100
  matchReasoning: string[]; // "Complementary Skills", "Shared Interest in AI"
  suggestedRoles: Record<string, string>; // { "userId1": "Researcher", "userId2": "Developer" }
  suggestedProjectTitles: string[];
}

export interface CollaborationActionPlan {
    steps: {
        title: string;
        description: string;
        status: 'Pending' | 'In Progress' | 'Completed';
    }[]
}
