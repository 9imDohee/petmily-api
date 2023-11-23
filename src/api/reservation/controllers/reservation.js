"use strict";

// const { re } = require("../../../../build/9659.0cfe2d22.chunk");
const review = require("../../review/controllers/review");

/**
 * reservation controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::reservation.reservation",
  ({ strapi }) => ({
    // 멤버, 펫시터 예약 조회
    async find(ctx) {
      const { id: userId } = ctx.state.user;
      const { type } = ctx.state.user.role;

      let filters = {};
      if (type === "public") {
        filters.client = { id: { $eq: userId } };
        filters.progress = {
          $in:
            ctx.request.query.condition === "expected"
              ? ["RESERVATION_REQUEST", "RESERVATION_CONFIRMED"]
              : ctx.request.query.condition === "finish"
              ? ["RESERVATION_CANCELLED", "FINISH_CARING"]
              : [
                  "RESERVATION_REQUEST",
                  "RESERVATION_CONFIRMED",
                  "RESERVATION_CANCELLED",
                  "FINISH_CARING",
                ],
        };
      } else if (type === "petsitter") {
        filters.petsitter = { id: { $eq: userId } };
        filters.progress = {
          $in:
            ctx.request.query.condition === "expected"
              ? ["RESERVATION_REQUEST", "RESERVATION_CONFIRMED"]
              : ctx.request.query.condition === "finish"
              ? ["RESERVATION_CANCELLED", "FINISH_CARING"]
              : [
                  "RESERVATION_REQUEST",
                  "RESERVATION_CONFIRMED",
                  "RESERVATION_CANCELLED",
                  "FINISH_CARING",
                ],
        };
      }

      try {
        const reservations = await strapi.entityService.findPage(
          "api::reservation.reservation",
          {
            sort: { id: "desc" },
            filters,
            populate: {
              pets: true,
              petsitter: {
                populate: { role: true, photo: true },
              },
              client: {
                fields: ["phone"],
              },
            },
            page: +ctx.request.query.page,
            pageSize: +ctx.request.query.size,
          }
        );

        const modifiedReservations = reservations.results.map(
          (reservation) => ({
            reservationId: reservation.id,
            reservationDate: reservation.reservationDate,
            reservationTimeStart: reservation.reservationTimeStart,
            reservationTimeEnd: reservation.reservationTimeEnd,
            address: reservation.address,
            reservationPhone: reservation.client.phone,
            reservationBody: reservation.body,
            progress: reservation.progress,
            petsitterId: reservation.petsitter.role.id,
            petsitterName: reservation.petsitter.username,
            petsitterNickName: reservation.petsitter.nickName,
            petsitterPhone: reservation.petsitter.phone,
            petsitterPhoto:
              reservation.petsitter &&
              reservation.petsitter.photo &&
              reservation.petsitter.photo.formats &&
              reservation.petsitter.photo.formats.thumbnail
                ? reservation.petsitter.photo.formats.thumbnail.url
                : null,
            pets: reservation.pets
              ? reservation.pets.map((pets) => ({
                  petId: pets.id,
                  name: pets.name,
                }))
              : null,
            journalId: reservation.journalId ? reservation.journalId : null,
          })
        );

        const pageInfo = {
          page: reservations.pagination.page,
          size: reservations.pagination.pageSize,
          totalElements: reservations.pagination.total,
          totalPages: reservations.pagination.pageCount,
        };

        ctx.send({ reservations: modifiedReservations, pageInfo });
      } catch (e) {
        console.log(e);
      }
    },

    // 예약 1개 조회 v
    async findOne(ctx) {
      if (!ctx.state.user) {
        ctx.send("에러");
      } else {
        try {
          const userId = ctx.state.user.id;
          const { id } = ctx.params;

          const reservation = await strapi.entityService.findOne(
            "api::reservation.reservation",
            id,
            {
              populate: {
                client: {
                  fields: ["username", "nickName", "body"],
                  populate: {
                    photo: true,
                  },
                },
                petsitter: {
                  fields: ["username", "nickName", "phone", "body"],
                  populate: {
                    photo: true,
                  },
                },
                pets: {
                  fields: [
                    "type",
                    "name",
                    "age",
                    "species",
                    "weight",
                    "male",
                    "neutering",
                    "body",
                    ,
                  ],
                  populate: {
                    photo: true,
                  },
                },
                review: { fields: ["id"] },
                journal: { fields: ["id"] },
              },
            }
          );

          if (
            userId === reservation.client.id ||
            userId === reservation.petsitter.id
          ) {
            const response = {
              reservationId: reservation.id,
              reservationDate: reservation.reservationDate,
              reservationTimeStart: reservation.reservationTimeStart,
              reservationTimeEnd: reservation.reservationTimeEnd,
              address: reservation.address,
              phone: reservation.petsitter.phone,
              body: reservation.body,
              progress: reservation.progress,
              member: {
                memberId: reservation.client.id,
                name: reservation.client.username,
                nickName: reservation.client.nickName,
                body: reservation.client.body,
                photo:
                  reservation.client.photo &&
                  reservation.client.photo.formats.thumbnail.url,
              },
              petsitter: {
                petsitterId: reservation.petsitter.id,
                name: reservation.petsitter.username,
                nickName: reservation.petsitter.nickName,
                body: reservation.petsitter.body,
                photo:
                  reservation.petsitter.photo &&
                  reservation.petsitter.photo.formats.thumbnail.url,
              },
              pets: reservation.pets,
              reviewId: reservation.review && reservation.review.id,
              journalId: reservation.journal && reservation.journal.id,
            };

            ctx.send(response);
          }
        } catch (e) {
          console.log(e);
        }
      }
    },

    // 예약 생성 v
    async create(ctx) {
      if (!ctx.state.user) {
        ctx.badRequest("로그인을 해주세요");
      } else {
        try {
          const data = ctx.request.body;

          const reservation = await strapi.entityService.create(
            "api::reservation.reservation",
            {
              data: {
                ...data,
                pets: data.petId,
                petsitter: data.petsitterId,
                client: ctx.state.user.id,
                progress: "RESERVATION_REQUEST",
              },
            }
          );

          return (ctx.body = "Create Reservation Success");
        } catch (e) {
          console.error(e);
          return ctx.badRequest("Reservation 생성 실패");
        }
      }
    },

    //펫시터 예약 확정 v
    async confirmReservation(ctx) {
      if (!ctx.state.user) {
        ctx.send("에러");
      } else {
        try {
          const userId = ctx.state.user.id;
          const reservationId = +ctx.params.reservationId;

          const reservation = await strapi.entityService.findOne(
            "api::reservation.reservation",
            reservationId,
            {
              populate: {
                petsitter: { fields: ["id"] },
              },
            }
          );

          if (
            userId === reservation.petsitter.id &&
            reservation.progress === "RESERVATION_REQUEST"
          ) {
            try {
              const response = await strapi.entityService.update(
                "api::reservation.reservation",
                reservationId,
                { data: { progress: "RESERVATION_CONFIRMED" } }
              );

              ctx.send("ok");
            } catch (e) {
              ctx.badRequest("예약 확정에 실패하였습니다.");
              console.log(e);
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    },

    // 펫시터 예약 취소 v
    async petsitterCancel(ctx) {
      if (!ctx.state.user) {
        ctx.send("에러");
      } else {
        try {
          const userId = ctx.state.user.id;
          const reservationId = +ctx.params.reservationId;

          const reservation = await strapi.entityService.findOne(
            "api::reservation.reservation",
            reservationId,
            {
              populate: {
                petsitter: { fields: ["id"] },
              },
            }
          );

          if (
            userId === reservation.petsitter.id &&
            reservation.progress === "RESERVATION_CONFIRMED"
          ) {
            try {
              const response = await strapi.entityService.update(
                "api::reservation.reservation",
                reservationId,
                { data: { progress: "RESERVATION_CANCELLED" } }
              );

              ctx.send("cancelled");
            } catch (e) {
              ctx.badRequest("예약 취소에 실패했습니다.");
            }
          }
        } catch (e) {}
      }
    },

    // 멤버 예약 취소 v
    async memberCancel(ctx) {
      if (!ctx.state.user) {
        ctx.send("에러");
      } else {
        try {
          const userId = ctx.state.user.id;
          const reservationId = +ctx.params.reservationId;

          const reservation = await strapi.entityService.findOne(
            "api::reservation.reservation",
            reservationId,
            {
              populate: {
                client: { fields: ["id"] },
              },
            }
          );

          if (
            userId === reservation.client.id &&
            reservation.progress === "RESERVATION_REQUEST"
          ) {
            try {
              const response = await strapi.entityService.update(
                "api::reservation.reservation",
                reservationId,
                { data: { progress: "RESERVATION_CANCELLED" } }
              );
              ctx.send("cancelled");
            } catch (e) {
              console.log(e);
              ctx.badRequest("예약 취소에 실패했습니다.");
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    },

    // 예약정보에 맞는 펫시터 조회
    async findPossiblePetsitter(ctx) {
      if (!ctx.state.user) {
        ctx.badRequest("권한이 없습니다.");
      } else if (ctx.state.user.role.type === "public") {
        const {
          reservationDate,
          reservationTimeStart,
          reservationTimeEnd,
          address,
          petId,
        } = ctx.request.body;

        // petsitter검색
        try {
          const pets = await strapi.entityService.findMany("api::pet.pet", {
            filters: {
              id: petId,
            },
          });

          const petsitters = await strapi.entityService.findMany(
            "plugin::users-permissions.user",
            {
              filters: {
                possibleDay: {
                  $contains: new Date(reservationDate).toLocaleDateString(
                    "ko-KR",
                    { weekday: "short" }
                  ),
                },
                possibleTimeStart: {
                  $lte: reservationTimeStart,
                },
                possibleTimeEnd: { $gte: reservationTimeEnd },
                possibleLocation: {
                  $contains: address.split(" ").slice(1, 3).join(" "),
                },
                possiblePetType: {
                  $contains: pets.map((pet) => pet.type),
                },
              },
              populate: {
                reservations_petsitter: {
                  populate: { review: { fields: ["star"] } },
                },
                photo: true,
              },
            }
          );

          const modifiedPetsitter = petsitters.map((petsitter) => ({
            petsitterId: petsitter.id,
            name: petsitter.username,
            nickName: petsitter.nickName,
            photo: petsitter.photo && petsitter.photo.formats.thumbnail.url,
            possibleDay: petsitter.possibleDay,
            possibleTimeStart: petsitter.possibleTimeStart,
            possibleTimeEnd: petsitter.possibleTimeEnd,
            star:
              Math.ceil(
                (petsitter.reservations_petsitter
                  .map(
                    (reservation) =>
                      reservation.review && reservation.review.star
                  )
                  .reduce((acc, cur) => acc + cur, 0) /
                  petsitter.reservations_petsitter
                    .map((reservation) => reservation.review)
                    .filter((review) => review).length) *
                  10
              ) / 10,
            reviewCount: petsitter.reservations_petsitter.map(
              (reservation) => reservation.review
            ).length,
          }));

          ctx.send(modifiedPetsitter);
        } catch (e) {
          console.log(e);
        }
      }
    },

    // 펫시터 예약일정 조회 v
    async sitterSchedule(ctx) {
      const { petsitterId } = ctx.params;

      if (!ctx.state.user) {
        return ctx.badRequest("권한이 없습니다.");
      } else if (ctx.state.user.id === +petsitterId) {
        try {
          const reservations = await strapi.entityService.findMany(
            "api::reservation.reservation",
            {
              sort: { reservationDate: "asc" },
              filters: {
                petsitter: { id: { $eq: petsitterId } },
                reservationDate: {
                  $gte: new Date().toISOString().substring(0, 10),
                },
                progress: {
                  $notIn: ["RESERVATION_CANCELLED", "FINISH_CARING"],
                },
              },
              start:
                (+ctx.request.query.page - 1) * +ctx.request.query.size || 0,
              limit: +ctx.request.query.page * +ctx.request.query.size || 0,
            }
          );

          const transformedReservations = reservations.map((reservation) => ({
            reservationId: reservation.id,
            reservationDate: reservation.reservationDate,
            reservationTimeStart: reservation.reservationTimeStart,
            reservationTimeEnd: reservation.reservationTimeEnd,
            progress: reservation.progress,
          }));

          ctx.send(transformedReservations);
        } catch (error) {
          console.error(error);
        }
      }
    },
  })
);
