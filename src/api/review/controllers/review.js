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
          // ...review,
          reviewId: review.id,
          memberId: review.reservation.client
            ? review.reservation.client.id
            : null,
          memberNickName: review.reservation.client
            ? review.reservation.client.nickName
            : null,
          memberPhoto: review.reservation.client
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
    const { id: userId } = ctx.state.user;
    const { reservationId } = ctx.request.body;

    // 후기는 예약과 연결되어있기 때문에 예약 먼저 찾아준다.
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

    // 검색 했을때 review가 없으면 create, 이미 있으면 에러
    // 고객이 작성하기 때문에 reservation의 속한 client와 정보가 일치해야 한다.
    // reservation의 상태가 FINISH_CARING일 때만 작성이 가능하다.
    if (reservation.client.id !== userId) {
      return ctx.badRequest("후기 등록 권한이 없습니다.");
    } else if (reservation.progress !== "FINISH_CARING") {
      return ctx.badRequest("예약이 종료 상태가 아닙니다.");
    } else if (
      reservation.client.id === userId &&
      !reservation.review &&
      reservation.progress === "FINISH_CARING"
    ) {
      // 아직 사진 등록 안됌.
      try {
        const newReview = await strapi.entityService.create(
          "api::review.review",
          {
            data: {
              ...ctx.request.body,
              photos: ctx.request.files.file,
              pets: [...reservation.pets],
              reservation: {
                connect: [reservationId],
              },
            },
          }
        );

        ctx.send("Create Review Success");
        return ctx;
      } catch (e) {
        return ctx.badRequest(
          "후기 등록에 실패하였습니다. 다시 한번 등록해주세요."
        );
      }
    }
  },

  async update(ctx) {
    // reservation에 속한 client여야 작성 가능하다.
    // console.log(ctx.state.user);
    const reviewId = +ctx.request.params.id;
    const { reservationId } = ctx.request.body;
    // console.log(ctx.request.files);
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

    const review = await strapi.entityService.findOne(
      "api::review.review",
      reviewId
    );

    // 유저기 이 예약을 가지고 있고, 작성된 review가 있어야
    console.log({ reservation });
    console.log({ review });
  },
}));
