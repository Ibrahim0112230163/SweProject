"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface CurrentSkillsProps {
  skills: UserSkill[]
}

export default function CurrentSkills({ skills }: CurrentSkillsProps) {
  const displaySkills =
    skills.length > 0
      ? skills
      : [
          { id: "1", skill_name: "Python", proficiency_level: 75 },
          { id: "2", skill_name: "UI Design", proficiency_level: 80 },
          { id: "3", skill_name: "Data Analysis", proficiency_level: 65 },
        ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Current Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Skills tags */}
        <div className="flex flex-wrap gap-2">
          {displaySkills.map((skill) => (
            <div key={skill.id} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
              {skill.skill_name}
            </div>
          ))}
        </div>

        {/* Update Skills Button */}
        <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">Update Skills</Button>
      </CardContent>
    </Card>
  )
}
