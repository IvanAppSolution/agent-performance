import { UserCustomers } from "@prisma/client"
import { db } from "~/libs/db.server"


export const modelUserCustomers = {
  count() {
    return db.userCustomers.count()
  },

  getAll() {
    return db.userCustomers.findMany()
  },

  async create({
    userId,
    customerId,
  }: Pick<
  UserCustomers,
    | "userId"
    | "customerId"
  >) {
    return db.userCustomers.create({
      data: {
        userId,
        customerId,        
      },
    })
  },

  async createMany(
    userId: string,
    customerId: any[],
  ) {
    let d = customerId.map(c => (
      {
        userId: userId,
        customerId: c
      } 
    ) )

    return db.userCustomers.createMany({
      data: d,
    })
  },

  update({
    userId,
    customerId,
    id,
  }: Pick<
    UserCustomers,
    | "userId"
    | "customerId"
    | "id"    
  >) {
    return db.userCustomers.update({
      where: { id },
      data: {
        userId,
        customerId,
      },
    })
  },
   
  getCustomersByUserId({ userId }: Pick<UserCustomers, "userId">) {
    return db.userCustomers.findMany({ where: { userId } })
  },
 
  deleteByUserId({ userId }: Pick<UserCustomers, "userId">) {
    return db.userCustomers.deleteMany({ where: { userId } })
  },

  deleteCustomerIdFromUserId({ userId, customerId }: Pick<UserCustomers, "userId" | "customerId">) {
    return db.userCustomers.deleteMany({ where: { userId, customerId } })
  },
 
}
