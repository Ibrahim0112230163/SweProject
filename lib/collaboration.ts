import { StudentProfile, TeamRecommendation } from "@/types/collaboration";

// Helper to calculate Jaccard Similarity for arrays
function calculateJaccardIndex(setA: string[], setB: string[]): number {
    const intersection = setA.filter((x) => setB.includes(x));
    const union = new Set([...setA, ...setB]);
    return intersection.length / union.size;
}

// 1. Interest & Domain Clustering (Weighted 40%)
function calculateInterestScore(user: StudentProfile, candidate: StudentProfile): number {
    const interestOverlap = calculateJaccardIndex(user.researchInterests, candidate.researchInterests);
    return interestOverlap * 100;
}

// 2. Skill Complementarity Analysis (Weighted 40%)
// We want diverse skill categories. If User A has mostly "Technical" and User B has "Domain" or "Soft", that's good.
// Simple heuristic: Count distinct unique skills added to the pool.
function calculateSkillComplementarity(user: StudentProfile, candidate: StudentProfile): number {
    const userSkills = new Set(user.skills.map(s => s.name));
    const candidateSkills = new Set(candidate.skills.map(s => s.name));

    // Find non-overlapping skills
    const uniqueToCandidate = [...candidateSkills].filter(x => !userSkills.has(x));

    // If candidate brings new skills, that's a plus. 
    // Cap at 5 unique skills for max score.
    const score = Math.min(uniqueToCandidate.length * 20, 100);
    return score;
}

// 3. Academic Compatibility Check (Weighted 20%)
function calculateAcademicFit(user: StudentProfile, candidate: StudentProfile): number {
    if (user.academicLevel !== candidate.academicLevel) return 0; // Strict level match
    if (user.thesisPhase && candidate.thesisPhase && user.thesisPhase !== candidate.thesisPhase) return 50; // Penalty for phase mismatch
    return 100;
}

// 4. Collaboration Quality Scoring
export function calculateCompatibility(user: StudentProfile, candidate: StudentProfile): { score: number, reasons: string[] } {
    const interestScore = calculateInterestScore(user, candidate);
    const skillScore = calculateSkillComplementarity(user, candidate);
    const academicScore = calculateAcademicFit(user, candidate);

    // Weights
    const totalScore = (interestScore * 0.4) + (skillScore * 0.4) + (academicScore * 0.2);

    const reasons: string[] = [];
    if (interestScore > 50) reasons.push("Shared Research Interests");
    if (skillScore > 50) reasons.push("Complementary Skill Sets");
    if (academicScore === 100) reasons.push("Aligned Academic Timeline");
    if (user.department !== candidate.department) reasons.push("Interdisciplinary Potential");

    return { score: Math.round(totalScore), reasons };
}

// 5. Team Recommendation Generation
export function generateTeamRecommendations(user: StudentProfile, candidates: StudentProfile[]): TeamRecommendation[] {
    return candidates
        .map(candidate => {
            if (candidate.id === user.id) return null;

            const { score, reasons } = calculateCompatibility(user, candidate);

            // Filter out low quality matches
            if (score < 40) return null;

            return {
                id: `rec-${user.id}-${candidate.id}`,
                targetUser: user,
                recommendedTeammates: [candidate],
                compatibilityScore: score,
                matchReasoning: reasons,
                suggestedRoles: {
                    [user.id]: user.collaborationPreference === 'Leader' ? 'Team Lead' : 'Researcher',
                    [candidate.id]: candidate.skills.some(s => s.category === 'Technical') ? 'Lead Developer' : 'Domain Analyst'
                },
                suggestedProjectTitles: [
                    `AI-Driven Analysis in ${user.researchInterests[0] || 'Tech'}`,
                    `Collaborative Study on ${candidate.researchInterests[0] || 'Innovation'}`
                ]
            };
        })
        .filter((x): x is TeamRecommendation => x !== null)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}
