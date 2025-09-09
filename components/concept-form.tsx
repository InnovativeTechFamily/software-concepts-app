"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import type Concept from "@/types/concept"

interface ConceptFormProps {
  concept?: Concept
  onSave: (concept: Omit<Concept, "_id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConceptForm({ concept, onSave, onCancel, isLoading = false }: ConceptFormProps) {
  const [formData, setFormData] = useState({
    topicID: concept?.topicID || 1,
    topic: concept?.topic || "",
    title: concept?.title || "",
    definition: concept?.definition || "",
    detailedExplanation: concept?.detailedExplanation || "",
    whenToUse: concept?.whenToUse || "",
    whyNeed: concept?.whyNeed || "",
    codeExample: concept?.codeExample || "",
    keyword: concept?.keyword || "",
    differences: concept?.differences || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{concept ? "Edit Concept" : "Add New Concept"}</CardTitle>
            <CardDescription>
              {concept ? "Update the concept details" : "Fill in the details for your new concept"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topicID">Topic ID</Label>
                <Input
                  id="topicID"
                  type="number"
                  value={formData.topicID}
                  onChange={(e) => handleChange("topicID", Number.parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  placeholder="e.g., C# Fundamentals"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Dependency Injection"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={formData.keyword}
                onChange={(e) => handleChange("keyword", e.target.value)}
                placeholder="e.g., DI, IoC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="definition">Definition</Label>
              <Textarea
                id="definition"
                value={formData.definition}
                onChange={(e) => handleChange("definition", e.target.value)}
                placeholder="Brief definition of the concept"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailedExplanation">Detailed Explanation</Label>
              <Textarea
                id="detailedExplanation"
                value={formData.detailedExplanation}
                onChange={(e) => handleChange("detailedExplanation", e.target.value)}
                placeholder="Comprehensive explanation of the concept"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whenToUse">When to Use</Label>
                <Textarea
                  id="whenToUse"
                  value={formData.whenToUse}
                  onChange={(e) => handleChange("whenToUse", e.target.value)}
                  placeholder="Scenarios where this concept applies"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whyNeed">Why Need</Label>
                <Textarea
                  id="whyNeed"
                  value={formData.whyNeed}
                  onChange={(e) => handleChange("whyNeed", e.target.value)}
                  placeholder="Benefits and importance"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeExample">Code Example</Label>
              <Textarea
                id="codeExample"
                value={formData.codeExample}
                onChange={(e) => handleChange("codeExample", e.target.value)}
                placeholder="Practical code example"
                rows={6}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="differences">Differences</Label>
              <Textarea
                id="differences"
                value={formData.differences}
                onChange={(e) => handleChange("differences", e.target.value)}
                placeholder="How this differs from similar concepts"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : concept ? "Update Concept" : "Add Concept"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
