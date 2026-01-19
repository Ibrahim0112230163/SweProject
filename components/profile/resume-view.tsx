"use client"

import { Mail, MapPin, Globe } from "lucide-react"

interface UserProfile {
    name: string | null
    bio: string | null
    avatar_url: string | null
    major: string | null
    email: string | null
}

interface UserSkill {
    id: string
    skill_name: string
    proficiency_level: number
}

interface ResumeViewProps {
    profile: UserProfile | null
    skills: UserSkill[]
}

export default function ResumeView({ profile, skills }: ResumeViewProps) {
    if (!profile) return null

    return (
        <div className="hidden print:block p-8 max-w-[210mm] mx-auto bg-white text-slate-900">
            {/* Header */}
            <header className="border-b-2 border-slate-800 pb-6 mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-wide text-slate-900 mb-2">{profile.name}</h1>
                <h2 className="text-xl text-slate-600 font-medium mb-4">{profile.major || "Computer Science Student"}</h2>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {profile.email && (
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            <span>{profile.email}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>Dhaka, Bangladesh</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        <span>swe-project.idx.com</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="col-span-2 space-y-8">
                    {/* Summary */}
                    {profile.bio && (
                        <section>
                            <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Professional Summary</h3>
                            <p className="text-slate-700 leading-relaxed text-justify">
                                {profile.bio}
                            </p>
                        </section>
                    )}

                    {/* Education - (Static for now, but usually dynamic) */}
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Education</h3>
                        <div className="mb-4">
                            <h4 className="font-bold text-slate-900">United International University</h4>
                            <p className="text-slate-700">B.Sc. in Computer Science & Engineering</p>
                            <p className="text-sm text-slate-500">2023 - Present</p>
                        </div>
                    </section>

                    {/* Projects - Structure example */}
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Key Projects</h3>
                        <div className="mb-4">
                            <h4 className="font-bold text-slate-900">AI-Powered Career Dashboard</h4>
                            <p className="text-slate-700 text-sm mb-1">Developed a comprehensive career management tool for CS students.</p>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                <li>Implemented real-time job matching using Google Gemini AI.</li>
                                <li>Built interactive skill mapping and visualization tools.</li>
                                <li>Utilized Next.js, Supabase, and Tailwind CSS.</li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Sidebar content */}
                <div className="space-y-8">
                    {/* Skills */}
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Skills</h3>
                        <div className="space-y-3">
                            {skills.map(skill => (
                                <div key={skill.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-800">{skill.skill_name}</span>
                                        {/* <span className="text-slate-500">{skill.proficiency_level}%</span> */}
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-slate-800 h-full rounded-full"
                                            style={{ width: `${skill.proficiency_level}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Languages */}
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Languages</h3>
                        <ul className="space-y-1 text-sm text-slate-700">
                            <li><span className="font-medium">English:</span> Fluent</li>
                            <li><span className="font-medium">Bengali:</span> Native</li>
                        </ul>
                    </section>

                    {/* Interests */}
                    <section>
                        <h3 className="text-lg font-bold uppercase border-b border-slate-300 pb-1 mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-700">Open Source</span>
                            <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-700">AI/ML</span>
                            <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-700">Hackathons</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
