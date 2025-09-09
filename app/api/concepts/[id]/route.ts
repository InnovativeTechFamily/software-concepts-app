import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Concept from "@/models/Concept"

// GET single concept
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const concept = await Concept.findById(params.id)

    if (!concept) {
      return NextResponse.json({ success: false, error: "Concept not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: concept })
  } catch (error) {
    console.error("Error fetching concept:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch concept" }, { status: 500 })
  }
}

// PUT update concept
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()

    const concept = await Concept.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })

    if (!concept) {
      return NextResponse.json({ success: false, error: "Concept not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: concept })
  } catch (error) {
    console.error("Error updating concept:", error)
    return NextResponse.json({ success: false, error: "Failed to update concept" }, { status: 500 })
  }
}

// DELETE concept
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const concept = await Concept.findByIdAndDelete(params.id)

    if (!concept) {
      return NextResponse.json({ success: false, error: "Concept not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: concept })
  } catch (error) {
    console.error("Error deleting concept:", error)
    return NextResponse.json({ success: false, error: "Failed to delete concept" }, { status: 500 })
  }
}
