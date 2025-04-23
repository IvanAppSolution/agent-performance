import { z } from "zod" 

const id = z.number({ required_error: "ID is required" })

const userId = z.string({ required_error: "UserId is required" }).min(1)

const password = z.string({ required_error: "Password is required" }).min(1)
 

export const schemaUserPassword = z.object({
  id,
  userId,
  password,
})

 
