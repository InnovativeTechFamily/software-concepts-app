"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConceptList } from "@/components/concept-list"
import { ConceptSearch } from "@/components/concept-search"
import { SettingsPanel } from "@/components/settings-panel"
import { Toaster } from "@/components/ui/toaster"
import { Search, List, Settings, BookOpen } from "lucide-react"
import type Concept from "@/types/concept"

export default function HomePage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConcepts()
  }, [])

  const loadConcepts = async () => {
    try {
      // First check localStorage
      const localConcepts = localStorage.getItem("concepts")
      if (localConcepts) {
        setConcepts(JSON.parse(localConcepts))
        setLoading(false)
        return
      }

      // If no local data, fetch from API
      const response = await fetch("/api/concepts")
      const result = await response.json()

      if (result.success) {
        setConcepts(result.data)
        localStorage.setItem("concepts", JSON.stringify(result.data))
      }
    } catch (error) {
      console.error("Error loading concepts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loading concepts...</h2>
            <p className="text-sm text-muted-foreground">Setting up your knowledge base</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              Software Concepts
            </h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto sm:mx-0 leading-relaxed">
            Manage and explore software development concepts with powerful search and organization tools
          </p>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 sm:h-auto mb-6 sm:mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <List className="h-4 w-4" />
              <span className="hidden xs:inline">Concepts</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Search className="h-4 w-4" />
              <span className="hidden xs:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden xs:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0">
            <ConceptList concepts={concepts} onConceptsChange={setConcepts} />
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <ConceptSearch concepts={concepts} onConceptsChange={setConcepts} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsPanel concepts={concepts} onConceptsChange={setConcepts} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
