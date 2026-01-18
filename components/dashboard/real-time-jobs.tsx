"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, TrendingUp, MapPin, DollarSign, Clock, Building2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RealTimeJob {
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    posted_at: string;
    source: string;
    description: string;
    url: string;
    matchScore: number;
    requiredSkills: string[];
    category: string;
    relevanceReason: string;
}

interface RealTimeJobsProps {
    userSkills?: string[];
    userExperience?: string;
}

export function RealTimeJobs({ userSkills, userExperience }: RealTimeJobsProps) {
    const [jobs, setJobs] = useState<RealTimeJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const fetchRealTimeJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/jobs/real-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userSkills, userExperience }),
            });

            const data = await response.json();
            if (data.success) {
                setJobs(data.jobs);
                setLastUpdated(new Date(data.lastUpdated).toLocaleString());
            }
        } catch (error) {
            console.error("Error fetching real-time jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealTimeJobs();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchRealTimeJobs, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const categories = ["all", ...Array.from(new Set(jobs.map(job => job.category)))];
    
    const filteredJobs = selectedCategory === "all" 
        ? jobs 
        : jobs.filter(job => job.category === selectedCategory);

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
        if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-slate-600 bg-slate-50 border-slate-200";
    };

    if (loading && jobs.length === 0) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <RefreshCw className="h-12 w-12 text-teal-500 animate-spin mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Fetching Real-Time Jobs from BD Job Sites
                        </h3>
                        <p className="text-slate-600">
                            Our AI is analyzing latest CS job postings from bdjobs.com and other platforms...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with AI Badge */}
            <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500 rounded-lg">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    AI-Powered Real-Time Jobs
                                    <Badge className="bg-teal-500 text-white">Live</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Latest CS opportunities from BD job sites, analyzed by AI
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={fetchRealTimeJobs}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">{filteredJobs.length} live jobs found</span>
                    {lastUpdated && (
                        <span className="text-slate-400">• Updated {lastUpdated}</span>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={selectedCategory === category ? "bg-teal-500 hover:bg-teal-600" : ""}
                        >
                            {category === "all" ? "All Categories" : category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* AI Insight Alert */}
            {filteredJobs.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        AI has analyzed {jobs.length} real-time job postings and ranked them based on your skills. 
                        Jobs with 85%+ match are highly recommended for you!
                    </AlertDescription>
                </Alert>
            )}

            {/* Job Listings */}
            <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                    <Card 
                        key={index} 
                        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-500"
                    >
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Company Logo */}
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md">
                                    {job.company[0]}
                                </div>

                                <div className="flex-1 space-y-3">
                                    {/* Title & Match Score */}
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                                                <Badge className={`${getMatchScoreColor(job.matchScore)} border font-semibold`}>
                                                    🎯 {job.matchScore}% Match
                                                </Badge>
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                    {job.category}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-teal-600 font-medium">
                                                <Building2 className="h-4 w-4" />
                                                {job.company}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4 text-slate-400" /> {job.salary}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-400" /> {job.posted_at}
                                        </div>
                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                                            {job.source}
                                        </Badge>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {job.description}
                                    </p>

                                    {/* AI Relevance Reason */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-semibold text-blue-900 mb-1">AI Insight</p>
                                                <p className="text-sm text-blue-800">{job.relevanceReason}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Required Skills */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700 mb-2">Required Skills:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.requiredSkills.map((skill, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    variant="secondary" 
                                                    className="bg-slate-100 border-slate-200 text-slate-700"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex md:flex-col gap-2 md:w-32">
                                    <Button 
                                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white gap-2"
                                        onClick={() => window.open(job.url, '_blank')}
                                    >
                                        Apply <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredJobs.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                No jobs found in this category
                            </h3>
                            <p className="text-slate-500 mb-4">
                                Try selecting a different category or refresh to see new opportunities
                            </p>
                            <Button
                                onClick={() => setSelectedCategory("all")}
                                variant="outline"
                                className="gap-2"
                            >
                                View All Jobs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
