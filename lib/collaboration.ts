import { StudentProfile, TeamRecommendation, ChatSession, Message } from "@/types/collaboration";
import { SupabaseClient } from "@supabase/supabase-js";


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

// 6. Database Integration Helpers

export async function fetchUserProfile(supabase: SupabaseClient, userId: string): Promise<StudentProfile | null> {
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*, user_skills(*)')
        .eq('user_id', userId)
        .single();

    if (error || !profile) return null;

    // Map DB profile to StudentProfile
    return {
        id: profile.user_id,
        name: profile.name || 'Anonymous',
        email: profile.email || '',
        avatarUrl: profile.avatar_url,
        academicLevel: 'Undergraduate', // Default
        department: profile.major || 'Computer Science',
        university: 'UIU', // Default
        researchInterests: [], // Need to store this in DB or assume from bio/skills
        skills: profile.user_skills?.map((s: any) => ({
            name: s.skill_name,
            category: 'Technical',
            level: s.proficiency_level > 80 ? 'Expert' : s.proficiency_level > 60 ? 'Advanced' : 'Intermediate'
        })) || [],
        projectPreferences: ['Product'], // Default
        availability: 'Part-time',
        collaborationPreference: profile.desired_role === 'Leader' ? 'Leader' : 'Contributor'
    };
}

export async function fetchCandidates(supabase: SupabaseClient): Promise<StudentProfile[]> {
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*, user_skills(*)');

    if (error) return [];

    return profiles.map((p: any) => ({
        id: p.user_id,
        name: p.name || 'Anonymous',
        email: p.email || '',
        avatarUrl: p.avatar_url,
        academicLevel: 'Undergraduate',
        department: p.major || 'General',
        university: 'UIU',
        researchInterests: [],
        skills: p.user_skills?.map((s: any) => ({
            name: s.skill_name,
            category: 'Technical',
            level: 'Intermediate'
        })) || [],
        projectPreferences: [],
        availability: 'Part-time',
        collaborationPreference: 'Contributor'
    }));
}

export async function createChatSession(supabase: SupabaseClient, userIds: string[], type: 'direct' | 'group' = 'direct') {
    // 1. Create Session
    const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({ type })
        .select()
        .single();

    if (sessionError) throw sessionError;

    // 2. Add Participants
    const participants = userIds.map(uid => ({
        session_id: session.id,
        user_id: uid
    }));

    const { error: partError } = await supabase
        .from('chat_participants')
        .insert(participants);

    if (partError) throw partError;

    return session;
}

export async function sendMessage(supabase: SupabaseClient, sessionId: string, senderId: string, content: string) {
    return await supabase
        .from('messages')
        .insert({
            session_id: sessionId,
            sender_id: senderId,
            content
        })
        .select()
        .single();
}

export async function getUserChats(supabase: SupabaseClient, userId: string): Promise<ChatSession[]> {
    // Fetch sessions where user is participant
    const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(`
            *,
            chat_participants!inner(user_id),
            messages(content, created_at, sender_id, is_read)
        `)
        .eq('chat_participants.user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;

    // Need to fetch other participants details
    return await Promise.all(sessions.map(async (s: any) => {
        // Get all participants for this session
        const { data: parts } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('session_id', s.id);

        const participantIds = parts?.map((p: any) => p.user_id) || [];

        // Fetch profiles
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, name, avatar_url')
            .in('user_id', participantIds);

        const mappedParticipants = profiles?.map((p: any) => ({
            id: p.user_id,
            name: p.name,
            avatarUrl: p.avatar_url,
            // ... minimal profile
        })) as any[]; // Type assertion for brevity

        const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;

        return {
            id: s.id,
            participants: mappedParticipants || [],
            messages: [], // Don't load all messages in list view
            lastMessage: lastMsg ? {
                id: 'latest', // Mock ID if not fetched
                senderId: lastMsg.sender_id,
                content: lastMsg.content,
                timestamp: new Date(lastMsg.created_at),
                isRead: lastMsg.is_read
            } : undefined,
            unreadCount: 0
        };
    }));
}
