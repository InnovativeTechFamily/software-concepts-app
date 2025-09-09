"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Edit, Calendar } from "lucide-react"
import type Concept from "@/types/concept"

interface ConceptViewProps {
  concept: Concept
  onClose: () => void
  onEdit: (concept: Concept) => void
}

export function ConceptView({ concept, onClose, onEdit }: ConceptViewProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{concept.topic}</Badge>
              <Badge variant="outline">{concept.keyword}</Badge>
            </div>
            <CardTitle className="text-2xl leading-tight mb-2">{concept.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {formatDate(concept.createdAt)}
              </span>
              {concept.updatedAt && concept.updatedAt !== concept.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated: {formatDate(concept.updatedAt)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(concept)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Definition</h3>
            <p className="text-muted-foreground leading-relaxed">{concept.definition}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Detailed Explanation</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{concept.detailedExplanation}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">When to Use</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{concept.whenToUse}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Why Need</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{concept.whyNeed}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Code Example</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{concept.codeExample}</code>
            </pre>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-2">Differences</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{concept.differences}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
