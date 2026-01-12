"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Briefcase, MapPin, DollarSign, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobMatch {
    id: string
    job_title: string
    company_name: string
    match_percentage: number
    required_skills: string[]
    location?: string
    salary?: string
    type?: string
    posted_at?: string
}

interface UserProfile {
    id: string
    user_id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    profile_completion_percentage: number
}

export default function JobsPage() {
    const router = useRouter()
    const supabase = createClient()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [jobs, setJobs] = useState<JobMatch[]>([])
    const [filteredJobs, setFilteredJobs] = useState<JobMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchJobsData = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    router.push("/auth/login")
                    return
                }

                // Fetch user profile
                const { data: profileData } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .single()

                setUserProfile(profileData)

                // Fetch job matches from Supabase
                const { data: jobMatchesData } = await supabase
                    .from("job_matches")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("match_percentage", { ascending: false })

                // Mock some extra details for the premium feel
                const jobsWithMetadata = (jobMatchesData || []).map(job => ({
                    ...job,
                    location: ["Remote", "New York, NY", "San Francisco, CA", "Austin, TX"][Math.floor(Math.random() * 4)],
                    salary: ["$80k - $120k", "$100k - $150k", "$70k - $90k", "Competitive"][Math.floor(Math.random() * 4)],
                    type: ["Full-time", "Contract", "Part-time"][Math.floor(Math.random() * 3)],
                    posted_at: "2 days ago"
                }))

                setJobs(jobsWithMetadata)
                setFilteredJobs(jobsWithMetadata)
            } catch (error) {
                console.error("Error fetching jobs data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchJobsData()
    }, [supabase, router])

    useEffect(() => {
        const filtered = jobs.filter(job =>
            job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.required_skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        setFilteredJobs(filtered)
    }, [searchQuery, jobs])

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

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                    {["All", "Full-time", "Remote", "Front-end", "Backend", "Data Science"].map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="px-4 py-1.5 cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Job Listings */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Logo Placeholder */}
                                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-slate-400">
                                            {job.company_name[0]}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">{job.job_title}</h3>
                                                    <p className="text-teal-600 font-medium">{job.company_name}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="text-sm font-semibold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                                                            {job.match_percentage}% Match
                                                        </span>
                                                    </div>
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

                                            <div className="flex flex-wrap gap-2">
                                                {job.required_skills.map((skill, idx) => (
                                                    <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-3 py-1 rounded-md border border-slate-100">
                                                        {skill}
                                                    </span>
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
                                onClick={() => setSearchQuery("")}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
