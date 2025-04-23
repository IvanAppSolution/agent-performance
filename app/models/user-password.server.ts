import { Password } from "@prisma/client"
import { db } from "~/libs/db.server"


export const modelUserPassword = {
     
  async create({
    userId,
    hash,
  }: Pick<
  Password,
    | "userId"
    | "hash"
  >) {
    return db.password.create({
      data: {
        userId,
        hash        
      },
    })
  },
 

  update({
    userId,
    hash,
  }: Pick<
  Password,
    | "userId"
    | "hash"
  >) {
    return db.password.update({
      where: { userId },
      data: {
        hash,
      },
    })
  },
    
}
