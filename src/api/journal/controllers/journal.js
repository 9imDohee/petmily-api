"use strict";

const reservation = require("../../reservation/controllers/reservation");

/**
 * journal controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::journal.journal", ({ strapi }) => ({
  // 케어 일지 전체 조회
  async fsnd(ctx) {
    if (!ctx.state.user) {
      ctx.send("에러");
    } else {
      // console.log(ctx.state.user);
      try {
        const userId = ctx.state.user.id;
        // console.log(userId);

        const journals = await strapi.entityService.findMany(
          "api::journal.journal",
          {
            populate: {
              photos: true,
              reservation: {
                populate: {
                  client: true,
                  petsitter: true,
                  pets: {
                    populate: {
                      file: true,
                    },
                  },
                },
              },
            },
            filters: {
              reservation: {
                $or: [
                  { client: { id: userId } },
                  { petsitter: { id: userId } },
                ],
              },
            },
          }
        );

        // console.log(journals);

        const modifiedJournals = journals.map((journal) => {
          const petNames = journal.reservation.pets.map((pet) => pet.name);

          const petPhotos = journal.reservation.pets.map((pet) => pet.file);

          return {
            journalId: journal.id,
            reservationId: journal.reservation.id,
            petsitterId: journal.reservation.petsitter.id,
            memberId: journal.reservation.client.id,
            createdAt: journal.createdAt,
            lastModifiedAt: journal.updatedAt,
            body: journal.body,
            photos: journal.photos,
            petNames: petNames,
            petPhotos: petPhotos,
            petsitterName: journal.reservation.petsitter.username,
            // petsitterPhoto: journal.reservation.petsitter.photo,
          };
        });

        ctx.send({ journals: modifiedJournals });
      } catch (e) {
        console.log(e);
      }
    }
  },

  // 케어 일지 1개 조회
  async findOne(ctx) {
    if (!ctx.state.user) {
      ctx.send("에러");
    } else {
      try {
        const userId = ctx.state.user.id;
        // console.log(userId);

        const { id } = ctx.params;
        const journal = await strapi.entityService.findOne(
          "api::journal.journal",
          id,
          {
            populate: {
              photos: true,
              reservation: {
                populate: {
                  client: true,
                  petsitter: true,
                  pets: {
                    populate: {
                      file: true,
                    },
                  },
                },
              },
            },
          }
        );
        console.log(journal);

        if (
          userId === journal.reservation.client.id ||
          userId === journal.reservation.petsitter.id
        ) {
          const petNames = journal.reservation.pets.map((pet) => pet.name);
          const petPhotos = journal.reservation.pets.map((pet) => pet.file);

          const response = {
            journalId: journal.id,
            reservationId: journal.reservation.id,
            petsitterId: journal.reservation.petsitter.id,
            memberId: journal.reservation.client.id,
            createdAt: journal.createdAt,
            lastModifiedAt: journal.updatedAt,
            body: journal.body,
            photos: journal.photos,
            petNames: petNames,
            petPhotos: petPhotos,
            petsitterName: journal.reservation.petsitter.username,
            // petsitterPhoto
          };

          ctx.send(response);
        } else {
          console.log("예약에 해당하는 유저가 아닙니다.");
        }
      } catch (e) {
        console.log(e);
      }
    }
  },

  // 케어 일지 등록
  async create(ctx) {
    const requestBody = ctx.request.body;
    // console.log(requestBody);

    const reservationId = requestBody.reservationId;

    const reservation = await strapi.entityService.findOne(
      "api::reservation.reservation",
      reservationId,
      {
        populate: { journal: true },
      }
    );
    console.log(reservation);

    const existingJournal = reservation.journal;
    console.log(existingJournal);

    if (existingJournal) {
      ctx.send("이미 작성한 일지가 존재합니다.");
    } else {
      const reservation = await strapi.entityService.findOne(
        "api::reservation.reservation",
        reservationId,
        {
          populate: { petsitter: { fields: ["id", "username"] } },
        }
      );

      if (reservation.petsitter.id === ctx.state.user.id) {
        try {
          const createdAt = new Date().toISOString();
          const lastModifiedAt = new Date().toISOString();

          const data = {
            ...requestBody,
            createdAt,
            lastModifiedAt,
            reservation: reservationId,
          };

          const newJournal = await strapi.entityService.create(
            "api::journal.journal",
            { data }
          );

          const response = "Create Journal Success";
          ctx.send(response);
        } catch (e) {
          console.log(e);
        }
      } else {
        ctx.send("예약과 일치하지 않는 펫시터입니다.");
      }
    }
  },

  // 케어 일지 수정
  async update(ctx) {
    if (!ctx.state.user) {
      ctx.send("에러");
    } else {
      try {
        const userId = ctx.state.user.id;
        console.log(userId);

        const journalId = +ctx.params.id;
        console.log(journalId);

        const journal = await strapi.entityService.findOne(
          "api::journal.journal",
          journalId,
          {
            populate: {
              reservation: {
                populate: {
                  petsitter: true,
                },
              },
            },
          }
        );
        console.log(journal);

        if (userId === journal.reservation.petsitter.id) {
          console.log("일치");
          try {
            const requestBody = ctx.request.body;
            console.log(requestBody);
            const data = requestBody;

            const updatedJournal = await strapi.entityService.update(
              "api::journal.journal",
              journalId,
              { data }
            );

            const response = "Update Success";
            ctx.send(response);
          } catch (e) {
            console.log(e);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  },
}));
