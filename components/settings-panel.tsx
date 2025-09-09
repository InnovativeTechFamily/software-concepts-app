"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Sun,
  Moon,
  Download,
  Upload,
  FileJson,
  Database,
  Palette,
  HardDrive,
  Cloud,
  CloudDownload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react"
import type Concept from "@/types/concept"

interface SettingsPanelProps {
  concepts: Concept[]
  onConceptsChange: (concepts: Concept[]) => void
}

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

export function SettingsPanel({ concepts, onConceptsChange }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState({
    syncTo: false,
    syncFrom: false,
    import: false,
    export: false,
  })
  const [jsonPreview, setJsonPreview] = useState<string>("")
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  const handleExport = () => {
    setIsLoading((prev) => ({ ...prev, export: true }))

    try {
      if (concepts.length === 0) {
        toast({
          title: "Nothing to export",
          description: "You don't have any concepts to export. Add some concepts first.",
          variant: "destructive",
        })
        return
      }

      const dataStr = JSON.stringify(concepts, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `software-concepts-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Successfully exported ${concepts.length} concepts to JSON file.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description:
          error instanceof Error
            ? `Export failed: ${error.message}`
            : "Failed to export concepts. This might be due to insufficient storage space or browser restrictions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, export: false }))
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file (.json extension required).",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 10MB. Please choose a smaller file.",
        variant: "destructive",
      })
      return
    }

    setIsLoading((prev) => ({ ...prev, import: true }))

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string

        if (!content || content.trim() === "") {
          throw new Error("File is empty or unreadable")
        }

        setJsonPreview(content)
        const validation = validateJsonContent(content)
        setValidationResult(validation)
        setIsLoading((prev) => ({ ...prev, import: false }))
      } catch (error) {
        console.error("File read error:", error)
        toast({
          title: "File read error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to read the selected file. Please try again or choose a different file.",
          variant: "destructive",
        })
        setIsLoading((prev) => ({ ...prev, import: false }))
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }

    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Failed to read the selected file. Please try again or choose a different file.",
        variant: "destructive",
      })
      setIsLoading((prev) => ({ ...prev, import: false }))
    }

    reader.readAsText(file)
  }

  const handleValidatedImport = async () => {
    if (!validationResult || !validationResult.isValid || validationResult.validConcepts.length === 0) {
      toast({
        title: "Cannot import",
        description: "Please fix all validation errors before importing.",
        variant: "destructive",
      })
      return
    }

    setIsLoading((prev) => ({ ...prev, import: true }))

    try {
      const importedConcepts = validationResult.validConcepts

      // Merge with existing concepts (avoid duplicates by title)
      const existingTitles = new Set(concepts.map((c) => c.title.toLowerCase()))
      const newConcepts = importedConcepts.filter((c: Concept) => !existingTitles.has(c.title.toLowerCase()))
      const updatedConcepts = [...concepts, ...newConcepts]

      // Update state and localStorage
      onConceptsChange(updatedConcepts)
      localStorage.setItem("concepts", JSON.stringify(updatedConcepts))

      toast({
        title: "Import successful",
        description: `Successfully imported ${newConcepts.length} new concepts. ${
          importedConcepts.length - newConcepts.length > 0
            ? `${importedConcepts.length - newConcepts.length} duplicates were skipped.`
            : ""
        }`,
      })

      // Reset validation state
      setJsonPreview("")
      setValidationResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import concepts. Please check the file format and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, import: false }))
    }
  }

  const handleCancelImport = () => {
    setJsonPreview("")
    setValidationResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSyncToDatabase = async () => {
    if (concepts.length === 0) {
      toast({
        title: "Nothing to sync",
        description: "You don't have any concepts to sync. Add some concepts first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading((prev) => ({ ...prev, syncTo: true }))

    try {
      const response = await fetch("/api/concepts/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ concepts }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sync successful",
          description: result.message || `Successfully synced ${result.count || concepts.length} concepts to database.`,
        })
      } else {
        throw new Error(result.details || result.error || "Sync failed")
      }
    } catch (error) {
      console.error("Sync error:", error)

      let errorMessage = "Failed to sync with database. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Network error: Please check your internet connection and try again."
        } else if (error.message.includes("Database connection failed")) {
          errorMessage = "Database connection failed. Please check your database configuration."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, syncTo: false }))
    }
  }

  const handleSyncFromDatabase = async () => {
    setIsLoading((prev) => ({ ...prev, syncFrom: true }))

    try {
      const response = await fetch("/api/concepts/sync", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        const databaseConcepts = result.concepts || []

        if (databaseConcepts.length === 0) {
          toast({
            title: "No data found",
            description: "No concepts found in the database to sync.",
          })
          return
        }

        // Update local state and localStorage
        onConceptsChange(databaseConcepts)
        localStorage.setItem("concepts", JSON.stringify(databaseConcepts))

        toast({
          title: "Sync successful",
          description: `Successfully synced ${databaseConcepts.length} concepts from database to local storage.`,
        })
      } else {
        throw new Error(result.details || result.error || "Failed to fetch from database")
      }
    } catch (error) {
      console.error("Sync from database error:", error)

      let errorMessage = "Failed to sync from database. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Network error: Please check your internet connection and try again."
        } else if (error.message.includes("Database connection failed")) {
          errorMessage = "Database connection failed. Please check your database configuration."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, syncFrom: false }))
    }
  }

  const validateJsonContent = (content: string): ValidationResult => {
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
        return result
      }

      // Step 2: Check if it's an array
      if (!Array.isArray(parsedData)) {
        result.errors.push({
          type: "error",
          message: "Root element must be an array of concepts",
        })
        return result
      }

      result.totalConcepts = parsedData.length

      if (parsedData.length === 0) {
        result.errors.push({
          type: "warning",
          message: "The file contains no concepts to import",
        })
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

      return result
    } catch (error) {
      result.errors.push({
        type: "error",
        message: `Unexpected validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      return result
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Customize your experience and manage your data</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle" className="text-base">
                Dark Mode
              </Label>
              <div className="text-sm text-muted-foreground">Toggle between light and dark themes</div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={handleThemeToggle}
                aria-label="Toggle dark mode"
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Import, export, and sync your concepts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <Label className="text-base">Export Concepts</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Download all your concepts as a JSON file for backup or sharing
            </p>
            <Button
              onClick={handleExport}
              disabled={isLoading.export}
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              <FileJson className="h-4 w-4 mr-2" />
              {isLoading.export ? "Exporting..." : `Export ${concepts.length} Concepts`}
            </Button>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <Label className="text-base">Import Concepts</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a JSON file to add concepts to your collection. The file will be validated before import.
            </p>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={isLoading.import}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading.import || jsonPreview !== ""}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isLoading.import ? "Reading File..." : "Choose JSON File"}
              </Button>
              {jsonPreview && (
                <Button onClick={handleCancelImport} variant="outline" size="sm">
                  Cancel
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: JSON files up to 10MB. Required fields: title, topic, definition, keyword
            </p>

            {validationResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    JSON Validation Results
                  </CardTitle>
                  <CardDescription>
                    {validationResult.isValid
                      ? `Ready to import ${validationResult.validConcepts.length} concepts`
                      : `Found ${validationResult.errors.filter((e) => e.type === "error").length} error${
                          validationResult.errors.filter((e) => e.type === "error").length !== 1 ? "s" : ""
                        } that need to be fixed`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                      {validationResult.isValid ? "Valid" : "Invalid"}
                    </Badge>
                    <Badge variant="outline">{validationResult.totalConcepts} Total Concepts</Badge>
                    <Badge variant="outline">{validationResult.validConcepts.length} Valid Concepts</Badge>
                    {validationResult.errors.filter((e) => e.type === "error").length > 0 && (
                      <Badge variant="destructive">
                        {validationResult.errors.filter((e) => e.type === "error").length} Errors
                      </Badge>
                    )}
                    {validationResult.errors.filter((e) => e.type === "warning").length > 0 && (
                      <Badge variant="secondary">
                        {validationResult.errors.filter((e) => e.type === "warning").length} Warnings
                      </Badge>
                    )}
                  </div>

                  {/* Error List */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {validationResult.errors.map((error, index) => (
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
                  {validationResult.validConcepts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Preview of concepts to be imported:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {validationResult.validConcepts.slice(0, 5).map((concept, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            <span className="font-medium">{concept.title}</span>
                            <span className="text-muted-foreground"> • {concept.topic}</span>
                          </div>
                        ))}
                        {validationResult.validConcepts.length > 5 && (
                          <div className="text-xs text-muted-foreground p-2">
                            ... and {validationResult.validConcepts.length - 5} more concepts
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Import button */}
                  {validationResult.isValid && (
                    <div className="flex gap-2">
                      <Button onClick={handleValidatedImport} disabled={isLoading.import} className="w-full sm:w-auto">
                        <Upload className="h-4 w-4 mr-2" />
                        {isLoading.import ? "Importing..." : `Import ${validationResult.validConcepts.length} Concepts`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Sync To Database */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <Label className="text-base">Sync to Database</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload your local concepts to the database. This will replace all database content with your local data.
            </p>
            <Button
              onClick={handleSyncToDatabase}
              disabled={isLoading.syncTo}
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              <Cloud className="h-4 w-4 mr-2" />
              {isLoading.syncTo ? "Syncing..." : "Sync to Database"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CloudDownload className="h-4 w-4" />
              <Label className="text-base">Sync from Database</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Download concepts from the database to your local storage. This will replace your local data with database
              content.
            </p>
            <Button
              onClick={handleSyncFromDatabase}
              disabled={isLoading.syncFrom}
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              <CloudDownload className="h-4 w-4 mr-2" />
              {isLoading.syncFrom ? "Syncing..." : "Sync from Database"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>Overview of your data storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Total Concepts</div>
              <div className="text-2xl font-bold">{concepts.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Topics</div>
              <div className="text-2xl font-bold">{new Set(concepts.map((c) => c.topic)).size}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Data is stored locally in your browser and can be synced with the database. Use sync features to keep data
            consistent across devices.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
