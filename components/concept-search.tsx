"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ConceptCard } from "./concept-card"
import { ConceptForm } from "./concept-form"
import { ConceptView } from "./concept-view"
import { Search, X, BookOpen, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import type Concept from "@/types/concept"

interface ConceptSearchProps {
  concepts: Concept[]
  onConceptsChange: (concepts: Concept[]) => void
}

export function ConceptSearch({ concepts, onConceptsChange }: ConceptSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingConcept, setEditingConcept] = useState<Concept | undefined>()
  const [viewingConcept, setViewingConcept] = useState<Concept | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Filter concepts based on search query
  const filteredConcepts = useMemo(() => {
    if (!searchQuery.trim()) {
      return concepts
    }

    const query = searchQuery.toLowerCase().trim()

    return concepts.filter((concept) => {
      return (
        concept.title.toLowerCase().includes(query) ||
        concept.keyword.toLowerCase().includes(query) ||
        concept.topic.toLowerCase().includes(query) ||
        concept.definition.toLowerCase().includes(query) ||
        concept.detailedExplanation.toLowerCase().includes(query) ||
        concept.whenToUse.toLowerCase().includes(query) ||
        concept.whyNeed.toLowerCase().includes(query) ||
        concept.differences.toLowerCase().includes(query)
      )
    })
  }, [concepts, searchQuery])

  // Group filtered concepts by topic
  const groupedConcepts = useMemo(() => {
    return filteredConcepts.reduce(
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
  }, [filteredConcepts])

  const handleSave = async (conceptData: Omit<Concept, "_id" | "createdAt" | "updatedAt">) => {
    setIsLoading(true)
    try {
      let response

      if (editingConcept?._id) {
        response = await fetch(`/api/concepts/${editingConcept._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conceptData),
        })
      } else {
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
          updatedConcepts = concepts.map((c) => (c._id === editingConcept._id ? result.data : c))
        } else {
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

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search concepts by title, keyword, topic, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {searchQuery ? (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Search Results</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {filteredConcepts.length} concept{filteredConcepts.length !== 1 ? "s" : ""} found
                  </span>
                </div>
                {Object.keys(groupedConcepts).length > 0 && (
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>
                      {Object.keys(groupedConcepts).length} topic{Object.keys(groupedConcepts).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Searching for: <span className="font-medium">"{searchQuery}"</span>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Search Concepts</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>
                  Search through {concepts.length} concept{concepts.length !== 1 ? "s" : ""} instantly
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && filteredConcepts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3">No concepts found</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              No concepts match your search for <span className="font-medium">"{searchQuery}"</span>. Try different
              keywords or check your spelling.
            </p>
            <Button variant="outline" onClick={clearSearch} size="lg">
              Clear Search
            </Button>
          </div>
        </div>
      ) : searchQuery ? (
        <div className="space-y-8">
          {Object.entries(groupedConcepts).map(([topic, topicConcepts]) => (
            <div key={topic} className="space-y-4">
              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="text-xl sm:text-2xl font-semibold text-balance">{topic}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {topicConcepts.length} concept{topicConcepts.length !== 1 ? "s" : ""} found
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
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="max-w-lg mx-auto">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3">Start searching</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Type in the search box above to find concepts by title, keyword, topic, or any content.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Search tips:</p>
                <ul className="space-y-1 text-left">
                  <li>• Search is case-insensitive</li>
                  <li>• Searches across all fields</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Features:</p>
                <ul className="space-y-1 text-left">
                  <li>• Results update as you type</li>
                  <li>• Use specific keywords</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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
