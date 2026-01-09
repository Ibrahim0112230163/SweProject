"use client"

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface AISkillMapProps {
  skills: UserSkill[]
}

export default function AISkillMap({ skills }: AISkillMapProps) {
  // Generate data for the skill map comparison
  const totalSkills = skills.length > 0 ? skills.length : 6
  const userSkillsSum = skills.reduce((sum, skill) => sum + skill.proficiency_level, 0)
  const userSkillsAverage = totalSkills > 0 ? userSkillsSum / totalSkills : 50

  // Market average (placeholder - will come from AI model)
  const marketSkillsAverage = 65

  const chartData = [
    {
      name: "Your Skills",
      value: Math.round(userSkillsAverage),
      fill: "#FCD34D",
    },
    {
      name: "Market Average",
      value: Math.round(marketSkillsAverage),
      fill: "#14B8A6",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Skill Map</CardTitle>
        <p className="text-xs text-slate-500 mt-2">
          Your skills (yellow) vs Market average (teal) - Coming from market analysis model
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full h-72 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ color: "#fff", paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
