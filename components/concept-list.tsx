"use client"

import { useState } from "react"
import { ConceptCard } from "./concept-card"
import { ConceptForm } from "./concept-form"
import { ConceptView } from "./concept-view"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Layers } from "lucide-react"
import type Concept from "@/types/concept"

interface ConceptListProps {
  concepts: Concept[]
  onConceptsChange: (concepts: Concept[]) => void
}

export function ConceptList({ concepts, onConceptsChange }: ConceptListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingConcept, setEditingConcept] = useState<Concept | undefined>()
  const [viewingConcept, setViewingConcept] = useState<Concept | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  // Group concepts by topic
  const groupedConcepts = concepts.reduce(
    (groups, concept) => {
      const topic = concept.topic
      if (!groups[topic]) {
        groups[topic] = []
      }
      groups[topic].push(concept)
      return groups
    },
    {} as Record<string, Concept[]>,
  )

  const handleSave = async (conceptData: Omit<Concept, "_id" | "createdAt" | "updatedAt">) => {
    setIsLoading(true)
    try {
      let response

      if (editingConcept?._id) {
        // Update existing concept
        response = await fetch(`/api/concepts/${editingConcept._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conceptData),
        })
      } else {
        // Create new concept
        response = await fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conceptData),
        })
      }

      const result = await response.json()

      if (result.success) {
        let updatedConcepts

        if (editingConcept?._id) {
          // Update existing concept in list
          updatedConcepts = concepts.map((c) => (c._id === editingConcept._id ? result.data : c))
        } else {
          // Add new concept to list
          updatedConcepts = [result.data, ...concepts]
        }

        onConceptsChange(updatedConcepts)
        localStorage.setItem("concepts", JSON.stringify(updatedConcepts))

        setShowForm(false)
        setEditingConcept(undefined)
      }
    } catch (error) {
      console.error("Error saving concept:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this concept?")) return

    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        const updatedConcepts = concepts.filter((c) => c._id !== id)
        onConceptsChange(updatedConcepts)
        localStorage.setItem("concepts", JSON.stringify(updatedConcepts))
      }
    } catch (error) {
      console.error("Error deleting concept:", error)
    }
  }

  const handleEdit = (concept: Concept) => {
    setEditingConcept(concept)
    setShowForm(true)
    setViewingConcept(undefined)
  }

  const handleView = (concept: Concept) => {
    setViewingConcept(concept)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingConcept(undefined)
  }

  if (concepts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-3">No concepts yet</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Start building your knowledge base by adding your first software development concept.
          </p>
          <Button onClick={() => setShowForm(true)} size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            Add First Concept
          </Button>
        </div>

        {showForm && <ConceptForm onSave={handleSave} onCancel={handleCancel} isLoading={isLoading} />}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with stats and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold">Your Concepts</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                {concepts.length} concept{concepts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              <span>
                {Object.keys(groupedConcepts).length} topic{Object.keys(groupedConcepts).length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg" className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          Add Concept
        </Button>
      </div>

      {/* Concepts grouped by topic */}
      {Object.entries(groupedConcepts).map(([topic, topicConcepts]) => (
        <div key={topic} className="space-y-4">
          <div className="border-l-4 border-primary pl-4 py-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-balance">{topic}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {topicConcepts.length} concept{topicConcepts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {topicConcepts.map((concept) => (
              <ConceptCard
                key={concept._id}
                concept={concept}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Modals */}
      {showForm && (
        <ConceptForm concept={editingConcept} onSave={handleSave} onCancel={handleCancel} isLoading={isLoading} />
      )}

      {viewingConcept && (
        <ConceptView concept={viewingConcept} onClose={() => setViewingConcept(undefined)} onEdit={handleEdit} />
      )}
    </div>
  )
}
