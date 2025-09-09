"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import type Concept from "@/types/concept"

interface ValidationError {
  type: "error" | "warning" | "info"
  message: string
  line?: number
  field?: string
  conceptIndex?: number
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  validConcepts: Concept[]
  totalConcepts: number
}

interface JsonValidatorProps {
  jsonContent: string
  onValidationComplete: (result: ValidationResult) => void
}

export function JsonValidator({ jsonContent, onValidationComplete }: JsonValidatorProps) {
  const validateJson = (content: string): ValidationResult => {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      validConcepts: [],
      totalConcepts: 0,
    }

    try {
      // Step 1: Parse JSON
      let parsedData: any
      try {
        parsedData = JSON.parse(content)
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : "Unknown parsing error"
        const lineMatch = errorMessage.match(/line (\d+)/i)
        const line = lineMatch ? Number.parseInt(lineMatch[1]) : undefined

        result.errors.push({
          type: "error",
          message: `JSON parsing failed: ${errorMessage}`,
          line,
        })
        onValidationComplete(result)
        return result
      }

      // Step 2: Check if it's an array
      if (!Array.isArray(parsedData)) {
        result.errors.push({
          type: "error",
          message: "Root element must be an array of concepts",
        })
        onValidationComplete(result)
        return result
      }

      result.totalConcepts = parsedData.length

      if (parsedData.length === 0) {
        result.errors.push({
          type: "warning",
          message: "The file contains no concepts to import",
        })
        onValidationComplete(result)
        return result
      }

      // Step 3: Validate each concept
      const requiredFields: (keyof Concept)[] = ["title", "topic", "definition", "keyword"]
      const optionalFields: (keyof Concept)[] = [
        "topicID",
        "detailedExplanation",
        "whenToUse",
        "whyNeed",
        "codeExample",
        "differences",
        "createdAt",
        "updatedAt",
      ]
      const allValidFields = [...requiredFields, ...optionalFields]

      const validConcepts: Concept[] = []
      const seenTitles = new Set<string>()

      parsedData.forEach((concept: any, index: number) => {
        const conceptErrors: ValidationError[] = []

        // Check if concept is an object
        if (!concept || typeof concept !== "object") {
          result.errors.push({
            type: "error",
            message: `Concept at position ${index + 1} is not a valid object`,
            conceptIndex: index,
          })
          return
        }

        // Check required fields
        requiredFields.forEach((field) => {
          if (!concept[field]) {
            conceptErrors.push({
              type: "error",
              message: `Missing required field: "${field}"`,
              field,
              conceptIndex: index,
            })
          } else if (typeof concept[field] !== "string") {
            conceptErrors.push({
              type: "error",
              message: `Field "${field}" must be a string`,
              field,
              conceptIndex: index,
            })
          } else if (concept[field].trim() === "") {
            conceptErrors.push({
              type: "error",
              message: `Field "${field}" cannot be empty`,
              field,
              conceptIndex: index,
            })
          }
        })

        // Check for unknown fields
        Object.keys(concept).forEach((key) => {
          if (!allValidFields.includes(key as keyof Concept)) {
            conceptErrors.push({
              type: "warning",
              message: `Unknown field "${key}" will be ignored`,
              field: key,
              conceptIndex: index,
            })
          }
        })

        // Check for duplicate titles
        if (concept.title && typeof concept.title === "string") {
          const titleLower = concept.title.toLowerCase().trim()
          if (seenTitles.has(titleLower)) {
            conceptErrors.push({
              type: "warning",
              message: `Duplicate title "${concept.title}" - only the first occurrence will be imported`,
              field: "title",
              conceptIndex: index,
            })
          } else {
            seenTitles.add(titleLower)
          }
        }

        // Check topicID if present
        if (concept.topicID !== undefined && typeof concept.topicID !== "number") {
          conceptErrors.push({
            type: "error",
            message: `Field "topicID" must be a number`,
            field: "topicID",
            conceptIndex: index,
          })
        }

        // Add concept-specific errors to main errors array
        result.errors.push(...conceptErrors)

        // If no critical errors, add to valid concepts
        const hasCriticalErrors = conceptErrors.some((err) => err.type === "error")
        if (!hasCriticalErrors) {
          validConcepts.push({
            topicID: concept.topicID || 0,
            topic: concept.topic?.trim() || "",
            title: concept.title?.trim() || "",
            definition: concept.definition?.trim() || "",
            detailedExplanation: concept.detailedExplanation?.trim() || "",
            whenToUse: concept.whenToUse?.trim() || "",
            whyNeed: concept.whyNeed?.trim() || "",
            codeExample: concept.codeExample?.trim() || "",
            keyword: concept.keyword?.trim() || "",
            differences: concept.differences?.trim() || "",
            createdAt: concept.createdAt ? new Date(concept.createdAt) : new Date(),
            updatedAt: concept.updatedAt ? new Date(concept.updatedAt) : new Date(),
          })
        }
      })

      result.validConcepts = validConcepts
      result.isValid = validConcepts.length > 0 && result.errors.filter((e) => e.type === "error").length === 0

      // Add summary info
      if (result.isValid) {
        result.errors.push({
          type: "info",
          message: `Validation successful! ${validConcepts.length} concepts ready for import`,
        })
      }

      onValidationComplete(result)
      return result
    } catch (error) {
      result.errors.push({
        type: "error",
        message: `Unexpected validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      onValidationComplete(result)
      return result
    }
  }

  React.useEffect(() => {
    if (jsonContent.trim()) {
      validateJson(jsonContent)
    }
  }, [jsonContent])

  const validation = validateJson(jsonContent)

  if (!jsonContent.trim()) {
    return null
  }

  const errorCount = validation.errors.filter((e) => e.type === "error").length
  const warningCount = validation.errors.filter((e) => e.type === "warning").length

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          JSON Validation Results
        </CardTitle>
        <CardDescription>
          {validation.isValid
            ? `Ready to import ${validation.validConcepts.length} concepts`
            : `Found ${errorCount} error${errorCount !== 1 ? "s" : ""} that need to be fixed`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={validation.isValid ? "default" : "destructive"}>
            {validation.isValid ? "Valid" : "Invalid"}
          </Badge>
          <Badge variant="outline">{validation.totalConcepts} Total Concepts</Badge>
          <Badge variant="outline">{validation.validConcepts.length} Valid Concepts</Badge>
          {errorCount > 0 && <Badge variant="destructive">{errorCount} Errors</Badge>}
          {warningCount > 0 && <Badge variant="secondary">{warningCount} Warnings</Badge>}
        </div>

        {/* Error List */}
        {validation.errors.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {validation.errors.map((error, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  error.type === "error"
                    ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                    : error.type === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300"
                      : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                }`}
              >
                {error.type === "error" ? (
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : error.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {error.conceptIndex !== undefined && `Concept ${error.conceptIndex + 1}: `}
                    {error.message}
                  </div>
                  {error.field && <div className="text-xs opacity-75 mt-1">Field: {error.field}</div>}
                  {error.line && <div className="text-xs opacity-75 mt-1">Line: {error.line}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview of valid concepts */}
        {validation.validConcepts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Preview of concepts to be imported:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {validation.validConcepts.slice(0, 5).map((concept, index) => (
                <div key={index} className="text-xs p-2 bg-muted rounded">
                  <span className="font-medium">{concept.title}</span>
                  <span className="text-muted-foreground"> • {concept.topic}</span>
                </div>
              ))}
              {validation.validConcepts.length > 5 && (
                <div className="text-xs text-muted-foreground p-2">
                  ... and {validation.validConcepts.length - 5} more concepts
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
