"use client";

import { useState, useEffect } from "react";
import { TeamCard } from "@/components/collaboration/team-card";
import { generateTeamRecommendations } from "@/lib/collaboration";
import { StudentProfile, TeamRecommendation } from "@/types/collaboration";
import { Loader2 } from "lucide-react";

// --- MOCK DATA FOR DEMONSTRATION ---
const MOCK_CURRENT_USER: StudentProfile = {
    id: "u1",
    name: "Alex Chen",
    email: "alex@uni.edu",
    academicLevel: "Undergraduate",
    department: "Computer Science",
    university: "Tech University",
    researchInterests: ["Machine Learning", "Healthcare", "Computer Vision"],
    skills: [
        { name: "Python", category: "Technical", level: "Advanced" },
        { name: "TensorFlow", category: "Technical", level: "Intermediate" },
        { name: "Data Analysis", category: "Technical", level: "Advanced" },
    ],
    projectPreferences: ["Thesis", "Research"],
    availability: "Full-time",
    collaborationPreference: "Leader",
    thesisPhase: "Research"
};

const MOCK_CANDIDATES: StudentProfile[] = [
    {
        id: "u2",
        name: "Sarah Miller",
        email: "sarah@uni.edu",
        academicLevel: "Undergraduate",
        department: "Bioinformatics",
        university: "Tech University",
        researchInterests: ["Healthcare", "Genomics", "Data Visualization"],
        skills: [
            { name: "Biology", category: "Domain", level: "Expert" },
            { name: "R", category: "Technical", level: "Intermediate" },
            { name: "Academic Writing", category: "Soft", level: "Advanced" },
        ],
        projectPreferences: ["Thesis"],
        availability: "Part-time",
        collaborationPreference: "Co-author",
        thesisPhase: "Research"
    },
    {
        id: "u3",
        name: "James Wilson",
        email: "james@uni.edu",
        academicLevel: "Undergraduate",
        department: "Computer Science",
        university: "Tech University",
        researchInterests: ["Web Development", "Cloud Computing"],
        skills: [
            { name: "React", category: "Technical", level: "Advanced" },
            { name: "Node.js", category: "Technical", level: "Advanced" },
        ],
        projectPreferences: ["Product"],
        availability: "Full-time",
        collaborationPreference: "Contributor",
        thesisPhase: "Development" // Mismatch phase
    },
    {
        id: "u4",
        name: "Priya Patel",
        email: "priya@uni.edu",
        academicLevel: "Undergraduate",
        department: "Data Science",
        university: "Tech University",
        researchInterests: ["Machine Learning", "NLP", "Education Tech"],
        skills: [
            { name: "Python", category: "Technical", level: "Advanced" },
            { name: "NLP", category: "Technical", level: "Intermediate" },
            { name: "Presentation", category: "Soft", level: "Advanced" }
        ],
        projectPreferences: ["Thesis"],
        availability: "Full-time",
        collaborationPreference: "Co-author",
        thesisPhase: "Research"
    }
];

export default function CollaborationPage() {
    const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API delay for "Agentic" feel
        const timer = setTimeout(() => {
            const recs = generateTeamRecommendations(MOCK_CURRENT_USER, MOCK_CANDIDATES);
            setRecommendations(recs);
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleConnect = (userId: string) => {
        alert(`Connecting with user ${userId}... (This would open a chat room)`);
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Collaboration Intelligence Agent</h1>
                <p className="text-muted-foreground mt-2">
                    Based on your profile, I've analyzed potential teammates for your thesis/project.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground animate-pulse">Analyzing skill compatibility...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.length > 0 ? (
                        recommendations.map((rec) => (
                            <TeamCard key={rec.id} recommendation={rec} onConnect={handleConnect} />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground">
                            No recommendations found at the moment. Try updating your skills.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
