import mongoose, { Schema, type Document } from "mongoose"
import type ConceptInterface from "@/types/concept"

export interface ConceptDocument extends ConceptInterface, Document {}

const ConceptSchema: Schema = new Schema(
  {
    topicID: {
      type: Number,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
    },
    detailedExplanation: {
      type: String,
      required: false,
    },
    whenToUse: {
      type: String,
      required: false,
    },
    whyNeed: {
      type: String,
      required: false,
    },
    codeExample: {
      type: String,
      required: false,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    differences: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better search performance
ConceptSchema.index({ title: "text", keyword: "text", topic: "text" })
ConceptSchema.index({ topicID: 1 })

export default mongoose.models.Concept || mongoose.model<ConceptDocument>("Concept", ConceptSchema)
