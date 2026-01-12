"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Briefcase, 
    MapPin, 
    Clock, 
    DollarSign, 
    Building2, 
    Bookmark,
    BookmarkCheck,
    Search,
    Filter,
    TrendingUp
} from "lucide-react";

// Mock Job Data
interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    experience: string;
    postedDate: string;
    logo?: string;
    description: string;
    skills: string[];
    matchScore: number;
    department: string;
}

const MOCK_JOBS: Job[] = [
    {
        id: "job1",
        title: "Senior Full Stack Developer",
        company: "TechCorp Solutions",
        location: "San Francisco, CA",
        type: "Full-time",
        salary: "$120k - $160k",
        experience: "3-5 years",
        postedDate: "2 days ago",
        description: "We're looking for a talented Full Stack Developer to join our growing team. You'll work on cutting-edge web applications using modern technologies.",
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
        matchScore: 95,
        department: "Engineering"
    },
    {
        id: "job2",
        title: "Machine Learning Engineer",
        company: "AI Innovations Inc",
        location: "Remote",
        type: "Full-time",
        salary: "$140k - $180k",
        experience: "4+ years",
        postedDate: "1 day ago",
        description: "Join our AI team to build and deploy machine learning models at scale. Experience with deep learning frameworks required.",
        skills: ["Python", "TensorFlow", "PyTorch", "ML", "Data Science"],
        matchScore: 88,
        department: "AI Research"
    },
    {
        id: "job3",
        title: "Product Designer",
        company: "Creative Studios",
        location: "New York, NY",
        type: "Full-time",
        salary: "$100k - $130k",
        experience: "2-4 years",
        postedDate: "3 days ago",
        description: "Looking for a creative product designer to craft beautiful user experiences. Strong portfolio required.",
        skills: ["Figma", "UI/UX", "Prototyping", "Design Systems"],
        matchScore: 82,
        department: "Design"
    },
    {
        id: "job4",
        title: "DevOps Engineer",
        company: "CloudScale Systems",
        location: "Austin, TX",
        type: "Full-time",
        salary: "$110k - $145k",
        experience: "3+ years",
        postedDate: "5 days ago",
        description: "Manage and optimize our cloud infrastructure. Experience with Kubernetes and CI/CD pipelines essential.",
        skills: ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform"],
        matchScore: 90,
        department: "Infrastructure"
    },
    {
        id: "job5",
        title: "Junior Frontend Developer",
        company: "StartupHub",
        location: "Remote",
        type: "Full-time",
        salary: "$70k - $90k",
        experience: "0-2 years",
        postedDate: "1 week ago",
        description: "Great opportunity for recent graduates or junior developers to grow their skills in a fast-paced startup environment.",
        skills: ["React", "JavaScript", "CSS", "HTML", "Git"],
        matchScore: 78,
        department: "Engineering"
    },
    {
        id: "job6",
        title: "Data Analyst",
        company: "Analytics Pro",
        location: "Boston, MA",
        type: "Full-time",
        salary: "$85k - $110k",
        experience: "2-3 years",
        postedDate: "4 days ago",
        description: "Analyze complex datasets and provide actionable insights to drive business decisions. SQL and Python experience required.",
        skills: ["SQL", "Python", "Tableau", "Excel", "Statistics"],
        matchScore: 85,
        department: "Data"
    },
    {
        id: "job7",
        title: "Backend Developer Intern",
        company: "Tech Innovators",
        location: "Seattle, WA",
        type: "Internship",
        salary: "$30/hour",
        experience: "0-1 years",
        postedDate: "2 days ago",
        description: "Summer internship opportunity for students passionate about backend development and scalable systems.",
        skills: ["Java", "Spring Boot", "REST API", "MySQL"],
        matchScore: 72,
        department: "Engineering"
    },
    {
        id: "job8",
        title: "Cybersecurity Specialist",
        company: "SecureNet",
        location: "Washington, DC",
        type: "Full-time",
        salary: "$115k - $150k",
        experience: "3-5 years",
        postedDate: "3 days ago",
        description: "Protect our systems and data from cyber threats. Security certifications and penetration testing experience preferred.",
        skills: ["Network Security", "Penetration Testing", "CISSP", "Python"],
        matchScore: 80,
        department: "Security"
    }
];

export default function JobsPage() {
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

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

    const filteredJobs = MOCK_JOBS.filter(job => {
        const matchesSearch = searchQuery === "" || 
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

        if (activeTab === "all") return matchesSearch;
        if (activeTab === "saved") return matchesSearch && savedJobs.has(job.id);
        if (activeTab === "recommended") return matchesSearch && job.matchScore >= 85;
        
        return matchesSearch;
    });

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
        return "text-slate-600 bg-slate-50 border-slate-200";
    };

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Job Opportunities</h1>
                <p className="text-muted-foreground">
                    Discover jobs that match your skills and career goals
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-50 rounded-lg">
                                <Briefcase className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{MOCK_JOBS.length}</p>
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
                                <p className="text-2xl font-bold">{MOCK_JOBS.filter(j => j.matchScore >= 85).length}</p>
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
                                <p className="text-2xl font-bold">{MOCK_JOBS.filter(j => j.postedDate.includes('day')).length}</p>
                                <p className="text-xs text-muted-foreground">New This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search jobs, companies, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="all">All Jobs ({MOCK_JOBS.length})</TabsTrigger>
                    <TabsTrigger value="recommended">
                        Recommended ({MOCK_JOBS.filter(j => j.matchScore >= 85).length})
                    </TabsTrigger>
                    <TabsTrigger value="saved">Saved ({savedJobs.size})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <Card key={job.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            {/* Company Logo */}
                                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {job.company[0]}
                                            </div>
                                            
                                            {/* Job Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <CardTitle className="text-xl">{job.title}</CardTitle>
                                                    {job.matchScore >= 85 && (
                                                        <Badge className={`${getMatchScoreColor(job.matchScore)} border`}>
                                                            {job.matchScore}% Match
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="text-base font-medium text-slate-900 mb-2">
                                                    {job.company}
                                                </CardDescription>
                                                
                                                {/* Job Meta Info */}
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{job.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="h-4 w-4" />
                                                        <span>{job.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span>{job.salary}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{job.experience}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="h-4 w-4" />
                                                        <span>{job.department}</span>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-slate-600 mb-3">
                                                    {job.description}
                                                </p>

                                                {/* Skills */}
                                                <div className="flex flex-wrap gap-2">
                                                    {job.skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-slate-100">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleSaveJob(job.id)}
                                                className={savedJobs.has(job.id) ? "text-teal-600" : ""}
                                            >
                                                {savedJobs.has(job.id) ? (
                                                    <BookmarkCheck className="h-5 w-5" />
                                                ) : (
                                                    <Bookmark className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-slate-500">Posted {job.postedDate}</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline">View Details</Button>
                                            <Button className="bg-teal-600 hover:bg-teal-700">Apply Now</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs found</h3>
                            <p className="text-slate-500">
                                {searchQuery ? "Try adjusting your search criteria" : "No jobs match your current filters"}
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
