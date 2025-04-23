import { type Pressrelease } from "@prisma/client"

// import { createPostSlug, getPostExcerpt } from "~/helpers/post"
import { db } from "~/libs/db.server"

// import { type PostStatusSymbol } from "~/types/post-status"

export const modelPressrelease = {
  count({ userId }: Pick<Pressrelease, "userId">) {
    return db.pressrelease.count({
      where: { userId },
    })
  },

  getAll({ userId }: Pick<Pressrelease, "userId">) {
    return db.pressrelease.findMany({
      where: { userId },
    })
  },

  getByIdByUserId({ id, userId }: Pick<Pressrelease, "id" | "userId">) {
    return db.pressrelease.findUnique({
      where: { id, userId },
    })
  },

  getById({ id }: Pick<Pressrelease, "id">) {
    return db.pressrelease.findUnique({
      where: { id },
    })
  },

  getId({ id }: Pick<Pressrelease, "id">) {
    return db.pressrelease.findUnique({
      where: { id },
    })
  },

  async create({
    userId,
    customerId,
    brand,
    publication,
    potentialReach,
    score,
    link,
    linkly,
    linkClicks,
    isTemp,
  }: Pick<
    Pressrelease,
    | "userId"
    | "customerId"
    | "brand"
    | "publication"
    | "potentialReach"
    | "score"
    | "link"
    | "linkly"
    | "linkClicks"
    | "isTemp"
  >) {
    return db.pressrelease.create({
      data: {
        userId,
        customerId,
        brand,
        publication,
        potentialReach,
        score,
        link,
        linkly,
        linkClicks,
        isTemp,
      },
    })
  },

  async createMany(
    pr: any[],
  ) {

    return db.pressrelease.createMany({
      data: pr,
    })
  },

  update({
    userId,
    customerId,
    id,
    dateRelease,
    brand,
    publication,
    potentialReach,
    score,
    link,
    linkly,
    linkClicks,
    isTemp,
  }: Pick<
    Pressrelease,
    | "userId"
    | "customerId"
    | "id"
    | "dateRelease"
    | "brand"
    | "publication"
    | "potentialReach"
    | "score"
    | "link"
    | "linkly"
    | "linkClicks"
    | "isTemp"
  >) {
    return db.pressrelease.update({
      where: { id },
      data: {
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
      },
    })
  },

  deleteAll({ userId }: Pick<Pressrelease, "userId">) {
    return db.pressrelease.deleteMany({ where: { userId } })
  },

  deleteById({ userId, id }: Pick<Pressrelease, "userId" | "id">) {
    return db.pressrelease.delete({ where: { id, userId } })
  },
}
