"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

interface UserProfile {
    name: string | null
    bio: string | null
    avatar_url: string | null
    major: string | null
}

interface UserSkill {
    id: string
}

interface ProfileCompletionProps {
    profile: UserProfile | null
    skills: UserSkill[]
}

export default function ProfileCompletion({ profile, skills }: ProfileCompletionProps) {
    // Calculate completion percentage
    const steps = [
        {
            id: "name_major",
            label: "Set Name & Major",
            isCompleted: !!(profile?.name && profile?.major),
            weight: 25,
        },
        {
            id: "bio",
            label: "Add a Bio",
            isCompleted: !!profile?.bio,
            weight: 25,
        },
        {
            id: "avatar",
            label: "Upload Profile Picture",
            isCompleted: !!profile?.avatar_url,
            weight: 25,
        },
        {
            id: "skills",
            label: "Add at least 3 Skills",
            isCompleted: skills.length >= 3,
            weight: 25,
        },
    ]

    const completionPercentage = steps.reduce((acc, step) => (step.isCompleted ? acc + step.weight : acc), 0)

    return (
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-teal-900">Profile Strength</CardTitle>
                    <span className="text-2xl font-bold text-teal-600">{completionPercentage}%</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-teal-500 transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 text-sm">
                            {step.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                            )}
                            <span className={step.isCompleted ? "text-slate-700 font-medium" : "text-slate-500"}>{step.label}</span>
                        </div>
                    ))}
                </div>

                {completionPercentage === 100 && (
                    <p className="text-sm text-teal-600 font-medium bg-teal-50 p-2 rounded text-center">
                        🎉 Great job! Your profile is complete.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
