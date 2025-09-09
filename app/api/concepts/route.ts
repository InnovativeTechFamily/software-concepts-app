import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Concept from "@/models/Concept"

// GET all concepts
export async function GET() {
  try {
    await dbConnect()
    const concepts = await Concept.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: concepts })
  } catch (error) {
    console.error("Error fetching concepts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch concepts" }, { status: 500 })
  }
}

// POST new concept
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const concept = await Concept.create(body)
    return NextResponse.json({ success: true, data: concept }, { status: 201 })
  } catch (error) {
    console.error("Error creating concept:", error)
    return NextResponse.json({ success: false, error: "Failed to create concept" }, { status: 500 })
  }
}
