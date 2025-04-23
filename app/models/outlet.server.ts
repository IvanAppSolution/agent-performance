import { Outlet } from "@prisma/client"
import { db } from "~/libs/db.server"


export const modelOutlet = {
  count() {
    return db.outlet.count()
  },

  getAll() {
    return db.outlet.findMany()
  },

  findByName({name}: Pick<
    Outlet,
    | "name"
  >) {
    return db.outlet.findMany({ 
      where: { name: {
        contains: name,
        mode: 'insensitive',
      }}, 
      select: {
      name: true,
      circulation: true,
      onlineUniqueUsers: true,
    }})
  },

  async create({
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
  }: Pick<
    Outlet,
    | "name"
    | "email"
    | "phone"
    | "address"
    | "website"
    | "twitter"
    | "twitter"
    | "mediaType"
    | "frequency"
    | "circulation"
    | "onlineUniqueUsers"
    | "sectors"
    | "seoRanking"
  >) {
    const data = {
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
    }
    return db.outlet.create({
      data,
    })
  },

  findByNameGetAllFields({name}: Pick<
    Outlet,
    | "name"
  >) {
    return db.outlet.findMany({ 
      where: { name: {
        startsWith: name,
        mode: 'insensitive',
      }}, 
      select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true, 
      website: true, 
      twitter: true, 
      mediaType: true, 
      frequency: true, 
      circulation: true, 
      onlineUniqueUsers: true, 
      sectors: true,
      seoRanking: true
    }})
  },
 
  update({
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
  }: Pick<
    Outlet,
    | "id"
    | "name"
    | "email"    
    | "phone" 
    | "address" 
    | "website" 
    | "twitter" 
    | "mediaType" 
    | "frequency" 
    | "circulation" 
    | "onlineUniqueUsers" 
    | "sectors" 
    | "seoRanking" 
  >) {
    return db.outlet.update({
      where: { id },
      data: {
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
      },
    })
  },
    
  deleteById({ id }: Pick<Outlet, "id">) {
    return db.outlet.delete({ where: { id } })
  },
 
}
