import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Concept from "@/models/Concept"

// POST sync localStorage data to MongoDB
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const { concepts } = await request.json()

    if (!Array.isArray(concepts)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format",
          details: "Expected an array of concepts but received different data type",
        },
        { status: 400 },
      )
    }

    // Validate concept structure
    const requiredFields = ["title", "topic", "definition", "keyword"]
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i]
      for (const field of requiredFields) {
        if (!concept[field]) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid concept data",
              details: `Concept at index ${i} is missing required field: ${field}`,
            },
            { status: 400 },
          )
        }
      }
    }

    // Clear existing concepts and insert new ones
    await Concept.deleteMany({})

    if (concepts.length > 0) {
      await Concept.insertMany(concepts)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${concepts.length} concepts to database`,
      count: concepts.length,
    })
  } catch (error) {
    console.error("Error syncing concepts:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed",
            details: "Unable to connect to MongoDB. Please check your internet connection and database configuration.",
          },
          { status: 503 },
        )
      }

      if (error.message.includes("ValidationError")) {
        return NextResponse.json(
          {
            success: false,
            error: "Data validation failed",
            details: "One or more concepts contain invalid data that doesn't match the required format.",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: "An unexpected error occurred while syncing data. Please try again later.",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    await dbConnect()

    const concepts = await Concept.find({}).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      message: `Retrieved ${concepts.length} concepts from database`,
      concepts: concepts,
      count: concepts.length,
    })
  } catch (error) {
    console.error("Error fetching concepts from database:", error)

    // Provide specific error messages for GET requests
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed",
            details: "Unable to connect to MongoDB. Please check your internet connection and database configuration.",
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve concepts",
        details: "An unexpected error occurred while fetching data from the database.",
      },
      { status: 500 },
    )
  }
}
