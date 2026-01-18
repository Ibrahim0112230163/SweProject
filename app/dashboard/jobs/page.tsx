"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    TrendingUp,
    BookmarkCheck,
    Bookmark,
    Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealTimeJobs } from "@/components/dashboard/real-time-jobs";

interface JobMatch {
    id: string;
    job_title: string;
    company_name: string;
    match_percentage: number;
    required_skills: string[];
    location?: string;
    salary?: string;
    type?: string;
    posted_at?: string;
    description?: string;
}

interface UserProfile {
    id: string;
    user_id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    profile_completion_percentage: number;
}

export default function JobsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [jobs, setJobs] = useState<JobMatch[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [userSkills, setUserSkills] = useState<string[]>([]);

    useEffect(() => {
        const fetchJobsData = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/auth/login");
                    return;
                }

                // Fetch user profile
                const { data: profileData } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                setUserProfile(profileData);

                // Fetch user skills from profile
                const { data: skillsData } = await supabase
                    .from("user_skills")
                    .select("skill_name")
                    .eq("user_id", user.id);
                
                if (skillsData) {
                    setUserSkills(skillsData.map((s: any) => s.skill_name));
                }

                // Fetch job matches from Supabase
                const { data: jobMatchesData } = await supabase
                    .from("job_matches")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("match_percentage", { ascending: false });

                // Add metadata for the UI experience
                const jobsWithMetadata = (jobMatchesData || []).map(job => ({
                    ...job,
                    location: job.location || ["Remote", "New York, NY", "San Francisco, CA", "Austin, TX"][Math.floor(Math.random() * 4)],
                    salary: job.salary || ["$80k - $120k", "$100k - $150k", "$70k - $90k", "Competitive"][Math.floor(Math.random() * 4)],
                    type: job.type || ["Full-time", "Contract", "Part-time"][Math.floor(Math.random() * 3)],
                    posted_at: job.posted_at || "2 days ago",
                    description: job.description || "Exciting opportunity to join a fast-growing team working on innovative solutions."
                }));

                setJobs(jobsWithMetadata);
                setFilteredJobs(jobsWithMetadata);
            } catch (error) {
                console.error("Error fetching jobs data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchJobsData();
    }, [supabase, router]);

    const toggleSaveJob = (jobId: string) => {
        setSavedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        const filtered = jobs.filter(job => {
            const matchesSearch = searchQuery === "" ||
                job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.required_skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (activeTab === "all") return true;
            if (activeTab === "recommended") return job.match_percentage >= 85;
            if (activeTab === "saved") return savedJobs.has(job.id);

            return true;
        });
        setFilteredJobs(filtered);
    }, [searchQuery, jobs, activeTab, savedJobs]);

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
        return "text-slate-600 bg-slate-50 border-slate-200";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    <p className="mt-4 text-slate-600">Finding your perfect match...</p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout userProfile={userProfile}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Recommended Jobs</h1>
                        <p className="text-slate-600">Based on your unique skill set and career goals</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Filters
                        </Button>
                        <Button className="bg-teal-500 hover:bg-teal-600">New Alert</Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-teal-50 rounded-lg">
                                    <Briefcase className="h-6 w-6 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{jobs.length}</p>
                                    <p className="text-xs text-muted-foreground">Total Jobs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{jobs.filter(j => j.match_percentage >= 85).length}</p>
                                    <p className="text-xs text-muted-foreground">High Match</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <BookmarkCheck className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{savedJobs.size}</p>
                                    <p className="text-xs text-muted-foreground">Saved Jobs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{jobs.filter(j => j.posted_at === "2 days ago").length}</p>
                                    <p className="text-xs text-muted-foreground">New Recently</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        className="pl-10 h-12 bg-white border-slate-200 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Search by job title, company, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
                        <TabsTrigger value="recommended">
                            Recommended ({jobs.filter(j => j.match_percentage >= 85).length})
                        </TabsTrigger>
                        <TabsTrigger value="realtime">
                            🔴 Live BD Jobs
                        </TabsTrigger>
                        <TabsTrigger value="saved">Saved ({savedJobs.size})</TabsTrigger>
                    </TabsList>

                    {/* Real-Time Jobs Tab */}
                    <TabsContent value="realtime">
                        <RealTimeJobs userSkills={userSkills} userExperience="Entry level" />
                    </TabsContent>

                    <TabsContent value="all" className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Company Logo */}
                                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                                {job.company_name[0]}
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-bold text-slate-900">{job.job_title}</h3>
                                                            <Badge className={`${getMatchScoreColor(job.match_percentage)} border`}>
                                                                {job.match_percentage}% Match
                                                            </Badge>
                                                        </div>
                                                        <p className="text-teal-600 font-medium">{job.company_name}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleSaveJob(job.id)}
                                                            className={savedJobs.has(job.id) ? "text-teal-600" : "text-slate-400"}
                                                        >
                                                            {savedJobs.has(job.id) ? (
                                                                <BookmarkCheck className="h-6 w-6" />
                                                            ) : (
                                                                <Bookmark className="h-6 w-6" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" /> {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-4 h-4" /> {job.salary}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-4 h-4" /> {job.type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" /> {job.posted_at}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600">
                                                    {job.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {job.required_skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-slate-50 border-slate-100 text-slate-600">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-end gap-2 md:w-32">
                                                <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white">Apply</Button>
                                                <Button variant="outline" className="flex-1">Details</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters to find more opportunities.</p>
                                <Button
                                    variant="link"
                                    className="text-teal-500 mt-2"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveTab("all");
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="recommended" className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Company Logo */}
                                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                                {job.company_name[0]}
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-bold text-slate-900">{job.job_title}</h3>
                                                            <Badge className={`${getMatchScoreColor(job.match_percentage)} border`}>
                                                                {job.match_percentage}% Match
                                                            </Badge>
                                                        </div>
                                                        <p className="text-teal-600 font-medium">{job.company_name}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleSaveJob(job.id)}
                                                            className={savedJobs.has(job.id) ? "text-teal-600" : "text-slate-400"}
                                                        >
                                                            {savedJobs.has(job.id) ? (
                                                                <BookmarkCheck className="h-6 w-6" />
                                                            ) : (
                                                                <Bookmark className="h-6 w-6" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" /> {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-4 h-4" /> {job.salary}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-4 h-4" /> {job.type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" /> {job.posted_at}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600">
                                                    {job.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {job.required_skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-slate-50 border-slate-100 text-slate-600">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-end gap-2 md:w-32">
                                                <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white">Apply</Button>
                                                <Button variant="outline" className="flex-1">Details</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters to find more opportunities.</p>
                                <Button
                                    variant="link"
                                    className="text-teal-500 mt-2"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveTab("all");
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="saved" className="space-y-4">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Company Logo */}
                                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                                {job.company_name[0]}
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-bold text-slate-900">{job.job_title}</h3>
                                                            <Badge className={`${getMatchScoreColor(job.match_percentage)} border`}>
                                                                {job.match_percentage}% Match
                                                            </Badge>
                                                        </div>
                                                        <p className="text-teal-600 font-medium">{job.company_name}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleSaveJob(job.id)}
                                                            className={savedJobs.has(job.id) ? "text-teal-600" : "text-slate-400"}
                                                        >
                                                            {savedJobs.has(job.id) ? (
                                                                <BookmarkCheck className="h-6 w-6" />
                                                            ) : (
                                                                <Bookmark className="h-6 w-6" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" /> {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-4 h-4" /> {job.salary}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-4 h-4" /> {job.type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" /> {job.posted_at}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-slate-600">
                                                    {job.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {job.required_skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-slate-50 border-slate-100 text-slate-600">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-end gap-2 md:w-32">
                                                <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white">Apply</Button>
                                                <Button variant="outline" className="flex-1">Details</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters to find more opportunities.</p>
                                <Button
                                    variant="link"
                                    className="text-teal-500 mt-2"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveTab("all");
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
