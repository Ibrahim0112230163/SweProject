"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";

export default function CollaborationTypeSelector() {
    const router = useRouter();

    const handleSelection = (type: "student" | "teacher") => {
        router.push(`/dashboard/collaboration/${type}`);
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Choose Collaboration Type</h1>
                <p className="text-muted-foreground mt-2">
                    Select who you want to collaborate with
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Student Collaboration Card */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-teal-500">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                            <Users className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Collaborate with Students</CardTitle>
                        <CardDescription className="text-base">
                            Find and connect with fellow students for projects, research, and study groups
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 mb-6 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="text-teal-500">✓</span>
                                <span>Find teammates with matching skills</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-teal-500">✓</span>
                                <span>Collaborate on academic projects</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-teal-500">✓</span>
                                <span>Real-time messaging and coordination</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-teal-500">✓</span>
                                <span>AI-powered team recommendations</span>
                            </li>
                        </ul>
                        <Button 
                            onClick={() => handleSelection("student")} 
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                            size="lg"
                        >
                            Connect with Students
                        </Button>
                    </CardContent>
                </Card>

                {/* Teacher Collaboration Card */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Collaborate with Teachers</CardTitle>
                        <CardDescription className="text-base">
                            Connect with instructors, advisors, and mentors for guidance and support
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 mb-6 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span>
                                <span>Get academic guidance and mentorship</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span>
                                <span>Discuss research opportunities</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span>
                                <span>Schedule office hours and meetings</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-purple-500">✓</span>
                                <span>Direct messaging with instructors</span>
                            </li>
                        </ul>
                        <Button 
                            onClick={() => handleSelection("teacher")} 
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                            size="lg"
                        >
                            Connect with Teachers
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
