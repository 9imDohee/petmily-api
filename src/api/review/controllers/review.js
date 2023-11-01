"use strict";

/**
 * review controller
 */

const { errors } = require("@strapi/utils");
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::review.review", ({ strapi }) => ({
  async find(ctx) {
    if (Object.keys(ctx.request.query).length === 0) {
      try {
        const reviews = await strapi.entityService.findMany(
          "api::review.review",
          {
            sort: { id: "desc" },
            populate: {
              photos: true,
              reservation: {
                populate: {
                  client: {
                    fields: ["username", "nickName"],
                    populate: { photo: true },
                  },
                  petsitter: { populate: { role: true, photo: true } },
                  pets: { populate: { file: true } },
                },
              },
            },
          }
        );

        const modifiedReviews = reviews.map((review) => ({
          ...review,
          reviewId: review.id,
          memberId: review.reservation.client.id
            ? review.reservation.client.id
            : null,
          memberNickName: review.reservation.client.nickName
            ? review.reservation.client.nickName
            : null,
          memberPhoto: review.reservation.client.photo
            ? review.reservation.client.photo
            : null,
          reservationId: review.reservation.id,
          reservationAddress: review.reservation.address,
          petNames: review.reservation.pets.map((pet) => pet.name),
          reviewPhotos: review.photos
            ? review.photos.map((photo) => photo?.formats?.thumbnail?.url)
            : null,
          body: review.body,
          petsitterId: review.reservation.petsitter.id,
          petsitterName: review.reservation.petsitter.username,
          petsitterPhoto: review.reservation.petsitter.photo,
          star: review.star,
          createdAt: review.createdAt,
          lastModifiedAt: review.updatedAt,
        }));

        ctx.send({ reviews: modifiedReviews });
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const filters = {
          reservation: {},
        };

        if (ctx.request.query.petsitterId) {
          filters.reservation.petsitter = {
            id: +ctx.request.query.petsitterId,
          };
        }

        const reviews = await strapi.entityService.findMany(
          "api::review.review",
          {
            sort: { id: "desc" },
            populate: {
              photos: true,
              reservation: {
                populate: {
                  client: {
                    fields: ["username", "nickName"],
                    populate: { photo: true },
                  },
                  petsitter: { populate: { role: true, photo: true } },
                  pets: { populate: { file: true } },
                },
              },
            },
            filters,
            start: (+ctx.request.query.page - 1) * +ctx.request.query.size || 0,
            limit: +ctx.request.query.page * +ctx.request.query.size || 0,
          }
        );

        const modifiedReviews = reviews.map((review) => ({
          // ...review,
          reviewId: review.id,
          memberId: review.reservation.client.id
            ? review.reservation.client.id
            : null,
          memberNickName: review.reservation.client.nickName
            ? review.reservation.client.nickName
            : null,
          memberPhoto: review.reservation.client.photo
            ? review.reservation.client.photo
            : null,
          reservationId: review.reservation.id,
          reservationAddress: review.reservation.address,
          petNames: review.reservation.pets.map((pet) => pet.name),
          reviewPhotos: review.photos
            ? review.photos.map((photo) => photo?.formats?.thumbnail?.url)
            : null,
          body: review.body,
          petsitterId: review.reservation.petsitter.id,
          petsitterName: review.reservation.petsitter.username,
          petsitterPhoto: review.reservation.petsitter.photo,
          star: review.star,
          createdAt: review.createdAt,
          lastModifiedAt: review.updatedAt,
        }));

        ctx.send({ reviews: modifiedReviews });
      } catch (e) {
        console.log(e);
      }
    }
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    try {
      const review = await strapi.entityService.findOne(
        "api::review.review",
        id
      );
      ctx.send(review);
    } catch (e) {
      console.log(e);
    }
  },

  async create(ctx) {
    // 검색 했을때 review가 없으면 create, 이미 있으면 에러
    // 고객이 작성하기 때문에 reservation의 속한 client와 정보가 일치해야 한다.
    const { id: userId } = ctx.state.user;
    const { reservationId } = ctx.request.body;

    const reservation = await strapi.entityService.findOne(
      "api::reservation.reservation",
      reservationId,
      {
        populate: {
          client: { fields: ["email"] },
          review: { fields: ["body"] },
        },
      }
    );

    if (reservation.client.id === userId && !reservation.review) {
      ctx.send("hi");
    }
  },
}));
