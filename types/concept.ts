export default interface Concept {
  _id?: string
  topicID: number
  topic: string
  title: string
  definition: string
  detailedExplanation: string
  whenToUse: string
  whyNeed: string
  codeExample: string
  keyword: string
  differences: string
  createdAt?: Date
  updatedAt?: Date
}
