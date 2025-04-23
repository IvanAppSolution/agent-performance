import { z } from "zod"
import { zfd } from "zod-form-data"

const id = z.number({ required_error: "Release ID is required" })

const userId = z.string({ required_error: "User Id is required" })
const customerId = z.string({ required_error: "Client Id is required" })

const dateRelease = z.date()

const brand = z.string().optional()

const publication = z.string().optional()

const potentialReach = z.number().optional()

const score = z.number().optional()

const link = z.string().optional()

const linkly = z.string().optional()

const linkClicks = z.number().optional()

const isTemp = z.coerce.boolean()

export const schemaPressrelease = z.object({
  id,
  userId,
  customerId,
  dateRelease,
  brand,
  publication,
  potentialReach,
  score,
  link,
  linkly,
  linkClicks,
  isTemp,
})

// export const schemaPressreleaseStatusUpdate = z.object({
//   postId: id,
//   statusSymbol,
// })

// export const schemaPressreleaseDeleteAll = z.object({})

export const schemaPressreleaseDeleteById = z.object({ id })
