import { type Connection, type User } from "@prisma/client"

import { db } from "~/libs/db.server"
import { hashPassword } from "~/utils/encryption.server"
import { getPlaceholderAvatarUrl } from "~/utils/placeholder"
import { createNanoIdShort } from "~/utils/string"

export const modelUser = {
  count() {
    return db.user.count()
  },

  getAll() {
    return db.user.findMany({
      include: {
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
    })
  },

  getCustomers({ customerIds }: { customerIds: string[] }) {
    return db.user.findMany({
      where: {
        id: { in: customerIds },
        typeId: 4,
        isActive: true
      },
      orderBy: {
        username: "asc",
      },
    })
  },

  getAllCustomers() {
    return db.user.findMany({
      where: {        
        typeId: 4,
        isActive: true
      },
      orderBy: {
        username: "asc",
      },
    })
  },

  getAgents() {
    return db.user.findMany({
      where: {
        typeId: 3,
        isActive: true
      },
      orderBy: {
        username: "asc",
      },
    })
  },

  getWithImages() {
    return db.user.findFirst({
      include: {
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
    })
  },

  getAllUsernames() {
    return db.user.findMany({
      select: {
        username: true,
        updatedAt: true,
      },
      orderBy: {
        username: "asc",
      },
    })
  },

  getForSession({ id }: Pick<User, "id">) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullname: true,
        username: true,
        nickname: true,
        email: true,
        typeId: true,
        selectedCustomerId: true,
        profilePicUrl: true,
        pagingRowLimit: true,
        roles: { select: { symbol: true, name: true } },
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
    })
  },

  getById({ id }: Pick<User, "id">) {
    return db.user.findUnique({ where: { id } })
  },

  getByUsername({ username }: Pick<User, "username">) {
    return db.user.findUnique({
      where: { username, isActive: true },
      include: {
        profiles: true,
        roles: { select: { symbol: true, name: true } },
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
    })
  },

  getByEmail({ email }: Pick<User, "email">) {
    return db.user.findUnique({
      where: { email, isActive: true },
      select: {
        id: true,
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
    })
  },

  search({ q }: { q: string | undefined }) {
    return db.user.findMany({
      where: {
        OR: [{ fullname: { contains: q } }, { username: { contains: q } }],
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        typeId: true,
        images: { select: { url: true }, orderBy: { updatedAt: "desc" } },
      },
      orderBy: [{ updatedAt: "asc" }],
    })
  },

  login({ email }: Pick<User, "email">) {
    // The logic is in Conform Zod validation
    return db.user.findUnique({ where: { email } })
  },

  async signup({
    email,
    fullname,
    typeId,
    password,
    isUserActive = "0",
  }: Pick<User, "fullname" | "email" | "typeId"> & {
    password: string // unencrypted password at first
    inviteBy?: string
    inviteCode?: string,
    isUserActive?: string,
  }) {
    // The logic is in Conform Zod validation
    const tempPicUrl = getPlaceholderAvatarUrl(email);

    return db.user.create({
      data: {
        fullname: fullname.trim(),
        username: email.trim(),
        email: email.trim(),
        typeId: typeId,
        roles: { connect: { symbol: "NORMAL" } },
        isActive: isUserActive === "1" ? true : false,
        password: { create: { hash: await hashPassword(password) } },
        images: { create: { url: tempPicUrl } },
        profilePicUrl: tempPicUrl,
        profiles: {
          create: {
            modeName: `Default ${fullname}`,
            headline: `The headline of ${fullname}`,
            bio: `The bio of ${fullname} for longer description.`,
          },
        },
      },
    })
  },

  async continueWithService({
    email,
    fullname,
    username,
    typeId,
    providerName,
    providerId,
    imageUrl,
  }: Pick<User, "email" | "fullname" | "username" | "typeId"> &
    Pick<Connection, "providerName" | "providerId"> & { imageUrl: string }) {
    const existingUsername = await modelUser.getByUsername({ username })
    const existingUser = await modelUser.getByEmail({ email })

    try {
      return db.user.upsert({
        where: { email },
        create: {
          email,
          fullname,
          typeId: typeId,
          roles: { connect: { symbol: "NORMAL" } },
          username: existingUsername ? `${username}_${createNanoIdShort()}` : username,
          images: {
            create: { url: imageUrl || getPlaceholderAvatarUrl(username) },
          },
          connections: {
            connectOrCreate: {
              where: { providerId_providerName: { providerName, providerId } },
              create: { providerName, providerId },
            },
          },
        },
        update: {
          images: !existingUser?.images[0]?.url
            ? { create: { url: imageUrl || getPlaceholderAvatarUrl(username) } }
            : undefined,
          connections: {
            connectOrCreate: {
              where: { providerId_providerName: { providerName, providerId } },
              create: { providerName, providerId },
            },
          },
        },
        select: { id: true },
      })
    } catch (error) {
      console.error(error)
      return null
    }
  },

  deleteById({ id }: Pick<User, "id">) {
    return db.user.delete({ where: { id } })
  },

  deleteByEmail({ email }: Pick<User, "email">) {
    if (!email) return { error: { email: `Email is required` } }
    return db.user.delete({ where: { email } })
  },

  updateUsername({ id, username }: Pick<User, "id" | "username">) {
    return db.user.update({
      where: { id },
      data: { username },
    })
  },

  updateFullName({ id, fullname }: Pick<User, "id" | "fullname">) {
    return db.user.update({
      where: { id },
      data: { fullname },
    })
  },

  updateNickName({ id, nickname }: Pick<User, "id" | "nickname">) {
    return db.user.update({
      where: { id },
      data: { nickname },
    })
  },

  updateEmail({ id, email }: Pick<User, "id" | "email">) {
    return db.user.update({
      where: { id },
      data: { email },
    })
  },

  updateTypeId({ id, typeId }: Pick<User, "id" | "typeId">) {
    return db.user.update({
      where: { id },
      data: { typeId },
    })
  },

  updateUserPrifilePicUrl ({ id, profilePicUrl }: Pick<User, "id" | "profilePicUrl">) {
    return db.user.update({
      where: { id },
      data: { profilePicUrl },
    })
  },

  updateSelectedCustomerId({ id, selectedCustomerId }: Pick<User, "id" | "selectedCustomerId">) {
    return db.user.update({
      where: { id },
      data: { selectedCustomerId },
    })
  },

  update({ id, email, fullname, isActive }: Pick<User, "id" | "email" | "fullname" | "isActive">) {
    return db.user.update({
      where: { id },
      data: { email, fullname, isActive },
    })
  },

  updatePagingRowLimit({ id, pagingRowLimit }: Pick<User, "id" | "pagingRowLimit">) {
    return db.user.update({
      where: { id },
      data: { pagingRowLimit },
    })
  },
}
