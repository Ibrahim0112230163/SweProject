"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Search, ArrowLeft, Mail, Clock, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ChatSession, Message } from "@/types/collaboration";
import { ChatList } from "@/components/collaboration/chat/chat-list";
import { ChatWindow } from "@/components/collaboration/chat/chat-window";

// Mock Teacher Data
interface Teacher {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    specializations: string[];
    officeHours: string;
    rating: number;
    avatar?: string;
}

interface CurrentUser {
    id: string;
    name: string;
    email: string;
}

const MOCK_CURRENT_USER: CurrentUser = {
    id: "student1",
    name: "Alex Chen",
    email: "alex@uni.edu"
};

const MOCK_TEACHERS: Teacher[] = [
    {
        id: "t1",
        name: "Dr. Emily Johnson",
        email: "emily.johnson@uni.edu",
        department: "Computer Science",
        designation: "Professor",
        specializations: ["Machine Learning", "Artificial Intelligence", "Data Science"],
        officeHours: "Mon & Wed, 2:00 PM - 4:00 PM",
        rating: 4.8,
        avatar: undefined
    },
    {
        id: "t2",
        name: "Prof. Michael Chen",
        email: "michael.chen@uni.edu",
        department: "Computer Science",
        designation: "Associate Professor",
        specializations: ["Software Engineering", "Web Development", "Cloud Computing"],
        officeHours: "Tue & Thu, 10:00 AM - 12:00 PM",
        rating: 4.6,
        avatar: undefined
    },
    {
        id: "t3",
        name: "Dr. Sarah Williams",
        email: "sarah.williams@uni.edu",
        department: "Data Science",
        designation: "Assistant Professor",
        specializations: ["Statistics", "Data Visualization", "Research Methods"],
        officeHours: "Wed & Fri, 3:00 PM - 5:00 PM",
        rating: 4.9,
        avatar: undefined
    },
    {
        id: "t4",
        name: "Prof. James Anderson",
        email: "james.anderson@uni.edu",
        department: "Information Systems",
        designation: "Professor",
        specializations: ["Database Systems", "System Design", "Enterprise Architecture"],
        officeHours: "Mon & Thu, 1:00 PM - 3:00 PM",
        rating: 4.7,
        avatar: undefined
    }
];

export default function TeacherCollaborationPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("find");
    const [searchQuery, setSearchQuery] = useState("");

    // Chat State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Simulate API delay
        const timer = setTimeout(() => {
            setTeachers(MOCK_TEACHERS);
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleConnect = (teacherId: string) => {
        // Check if session exists
        let existingSession = sessions.find(s => 
            s.participants.some(p => p.id === teacherId)
        );

        if (!existingSession) {
            const teacher = teachers.find(t => t.id === teacherId);
            if (!teacher) return;

            const newSession: ChatSession = {
                id: `chat-${Date.now()}`,
                participants: [
                    {
                        id: MOCK_CURRENT_USER.id,
                        name: MOCK_CURRENT_USER.name,
                        email: MOCK_CURRENT_USER.email,
                        academicLevel: "Undergraduate",
                        department: "Computer Science",
                        university: "Tech University",
                        researchInterests: [],
                        skills: [],
                        projectPreferences: [],
                        availability: "Full-time",
                        collaborationPreference: "Contributor",
                        thesisPhase: "Research"
                    },
                    {
                        id: teacher.id,
                        name: teacher.name,
                        email: teacher.email,
                        academicLevel: "Graduate",
                        department: teacher.department,
                        university: "Tech University",
                        researchInterests: teacher.specializations,
                        skills: [],
                        projectPreferences: [],
                        availability: "Full-time",
                        collaborationPreference: "Leader",
                        thesisPhase: undefined
                    }
                ],
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
                <h1 className="text-3xl font-bold tracking-tight">Teacher Collaboration</h1>
                <p className="text-muted-foreground mt-2">
                    Connect with instructors and mentors for guidance and support.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="find" className="flex items-center gap-2">
                        <Search className="w-4 h-4" /> Find Teachers
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Messages
                        {sessions.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">{sessions.length}</span>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="find" className="space-y-6">
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, department, or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                            <p className="text-muted-foreground animate-pulse">Loading teachers...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                    <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={teacher.avatar} alt={teacher.name} />
                                                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-lg">
                                                        {teacher.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl mb-1">{teacher.name}</CardTitle>
                                                    <CardDescription className="flex flex-col gap-1">
                                                        <span className="font-medium text-purple-600">{teacher.designation}</span>
                                                        <span>{teacher.department}</span>
                                                    </CardDescription>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm font-medium">{teacher.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2">Specializations</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {teacher.specializations.map((spec, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700">
                                                            {spec}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Clock className="h-4 w-4" />
                                                <span>{teacher.officeHours}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{teacher.email}</span>
                                            </div>
                                            <Button 
                                                onClick={() => handleConnect(teacher.id)}
                                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                Send Message
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center text-muted-foreground py-10">
                                    No teachers found matching your search.
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
                                        Select a conversation from the list or find a teacher to start messaging.
                                    </p>
                                    <Button variant="outline" className="mt-6" onClick={() => setActiveTab("find")}>
                                        Find Teachers
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
