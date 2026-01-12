"use client";

import { useState, useEffect } from "react";
import { TeamCard } from "@/components/collaboration/team-card";
import { generateTeamRecommendations } from "@/lib/collaboration";
import { StudentProfile, TeamRecommendation, ChatSession, Message } from "@/types/collaboration";
import { Loader2, MessageSquare, Search, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatList } from "@/components/collaboration/chat/chat-list";
import { ChatWindow } from "@/components/collaboration/chat/chat-window";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        thesisPhase: "Development"
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

export default function StudentCollaborationPage() {
    const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("find");

    // Chat State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

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
        // Check if session exists
        let existingSession = sessions.find(s => s.participants.some(p => p.id === userId));

        if (!existingSession) {
            const targetUser = MOCK_CANDIDATES.find(c => c.id === userId);
            if (!targetUser) return;

            const newSession: ChatSession = {
                id: `chat-${Date.now()}`,
                participants: [MOCK_CURRENT_USER, targetUser],
                messages: [],
                unreadCount: 0
            };

            setSessions(prev => [newSession, ...prev]);
            existingSession = newSession;
        }

        setSelectedSessionId(existingSession.id);
        setActiveTab("messages");
    };

    const handleSendMessage = (sessionId: string, content: string) => {
        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: MOCK_CURRENT_USER.id,
            content,
            timestamp: new Date(),
            isRead: false
        };

        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                return {
                    ...session,
                    messages: [...session.messages, newMessage],
                    lastMessage: newMessage
                };
            }
            return session;
        }));
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <Link href="/dashboard/collaboration">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Collaboration Types
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Student Collaboration</h1>
                <p className="text-muted-foreground mt-2">
                    Find and collaborate with fellow students for your academic journey.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="find" className="flex items-center gap-2">
                        <Search className="w-4 h-4" /> Find Teammates
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Messages
                        {sessions.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">{sessions.length}</span>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="find" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="messages" className="min-h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                        <div className="md:col-span-1">
                            <ChatList
                                sessions={sessions}
                                currentUserId={MOCK_CURRENT_USER.id}
                                selectedSessionId={selectedSessionId}
                                onSelectSession={setSelectedSessionId}
                            />
                        </div>
                        <div className="md:col-span-2">
                            {selectedSessionId ? (
                                <ChatWindow
                                    session={sessions.find(s => s.id === selectedSessionId)!}
                                    currentUserId={MOCK_CURRENT_USER.id}
                                    onSendMessage={handleSendMessage}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full border rounded-lg bg-slate-50 text-center p-8">
                                    <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">Your Messages</h3>
                                    <p className="text-slate-500 max-w-sm mt-2">
                                        Select a conversation from the list or find a teammate to start chatting.
                                    </p>
                                    <Button variant="outline" className="mt-6" onClick={() => setActiveTab("find")}>
                                        Find Teammates
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
