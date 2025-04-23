import { z } from "zod" 

const id = z.number().optional() 
const name = z.string({ required_error: "Name required" }).min(2)
const email = z.string().email("This is not a valid email.").optional() 
const phone = z.string().optional() 
const address = z.string().optional()
const website = z.string().optional()
const twitter = z.string().optional()
const mediaType = z.string().optional()
const frequency = z.string().optional()
const circulation = z.string().optional()
const onlineUniqueUsers = z.string().optional()
const sectors = z.string().optional()
const seoRanking = z.string().optional()

export const schemaOutlet = z.object({
  id,
  name,
  email,
  phone,
  address,
  website,
  twitter,
  mediaType,
  frequency,
  circulation,
  onlineUniqueUsers,
  sectors,
  seoRanking,
})




// export const schemaOutletDeleteAll = z.object({})

export const schemaOutletDeleteById = z.object({ id })
