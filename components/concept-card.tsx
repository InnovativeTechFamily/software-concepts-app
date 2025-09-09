"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import type Concept from "@/types/concept"

interface ConceptCardProps {
  concept: Concept
  onEdit: (concept: Concept) => void
  onDelete: (id: string) => void
  onView: (concept: Concept) => void
}

export function ConceptCard({ concept, onEdit, onDelete, onView }: ConceptCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!concept._id) return

    setIsDeleting(true)
    try {
      await onDelete(concept._id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {concept.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-medium">
                {concept.topic}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {concept.keyword}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">{concept.definition}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0 mt-auto flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(concept)} className="flex-1 text-xs sm:text-sm">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden xs:inline">View</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(concept)} className="px-2 sm:px-3">
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Edit concept</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2 sm:px-3 bg-transparent"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Delete concept</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
