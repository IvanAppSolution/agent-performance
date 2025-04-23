import { z } from "zod" 

const id = z.number({ required_error: "ID is required" })

const userId = z.string({ required_error: "UserId is required" }).min(1)

const customerId = z.string({ required_error: "CustomerId required" }).min(1)
 

export const schemaUserCustomers = z.object({
  id,
  userId,
  customerId,
})


export const schemaUsercustomerDeleteAll = z.object({})

export const schemaUsercustomerDeleteById = z.object({ id })
