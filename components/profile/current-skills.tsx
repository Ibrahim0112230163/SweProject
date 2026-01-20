"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Plus, X } from "lucide-react"

interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface CurrentSkillsProps {
  skills: UserSkill[]
  onSkillsUpdate?: () => void
}

export default function CurrentSkills({ skills, onSkillsUpdate }: CurrentSkillsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState([50])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Display skills or default ones if empty (for visual purposes in initial state)
  const displaySkills =
    skills.length > 0
      ? skills
      : [
        { id: "1", skill_name: "Python", proficiency_level: 75 },
        { id: "2", skill_name: "UI Design", proficiency_level: 80 },
        { id: "3", skill_name: "Data Analysis", proficiency_level: 65 },
      ]

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_name: newSkillName.trim(),
        proficiency_level: newSkillLevel[0],
      })

      if (error) throw error

      setNewSkillName("")
      setNewSkillLevel([50])
      if (onSkillsUpdate) onSkillsUpdate()
    } catch (error) {
      const errorMessage = (error as any).message || "Unknown error"
      console.error("Error adding skill:", error)
      alert(`Failed to add skill: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSkill = async (id: string, isDefault: boolean) => {
    if (isDefault) return // Don't try to delete fake default skills

    if (!confirm("Are you sure you want to delete this skill?")) return

    try {
      const { error } = await supabase.from("user_skills").delete().eq("id", id)

      if (error) throw error

      if (onSkillsUpdate) onSkillsUpdate()
    } catch (error) {
      console.error("Error deleting skill:", error)
      alert("Failed to delete skill. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
          {skills.length === 0 && (
            <p className="text-sm text-slate-500 italic">No skills added yet. Add some skills to see them here.</p>
          )}
        </div>

        {/* Update Skills Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">Manage Skills</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Manage Skills</DialogTitle>
              <DialogDescription>Add new skills or remove existing ones.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Add New Skill Section */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-medium text-sm text-slate-900">Add New Skill</h4>
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="skill-name">Skill Name</Label>
                    <Input
                      id="skill-name"
                      placeholder="e.g. React, Python"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Proficiency ({newSkillLevel[0]}%)</Label>
                    <Slider
                      value={newSkillLevel}
                      onValueChange={setNewSkillLevel}
                      max={100}
                      step={1}
                      className="py-2"
                    />
                  </div>
                  <Button
                    onClick={handleAddSkill}
                    disabled={isSubmitting || !newSkillName.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    size="sm"
                  >
                    {isSubmitting ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Skill
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Existing Skills List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-slate-900">Your Skills</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
                      >
                        <div>
                          <p className="font-medium text-sm">{skill.skill_name}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${skill.proficiency_level}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{skill.proficiency_level}%</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSkill(skill.id, false)}
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No skills added yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
