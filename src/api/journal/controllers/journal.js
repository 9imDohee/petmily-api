"use strict";

/**
 * journal controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::journal.journal", ({ strapi }) => ({
  // 케어 일지 전체 조회
  async find(ctx) {
    try {
      const journals = await strapi.entityService.findMany(
        "api::journal.journal",
        {
          populate: {
            photos: true,
            reservation: {
              populate: {
                client: true,
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

      const modifiedJournals = journals.map((journal) => {
        const petNames = journal.reservation.pets.map((pet) => pet.name);

        const petPhotos = journal.reservation.pets.map((pet) => pet.file);

        return {
          journalId: journal.id,
          reservationId: journal.reservation.id,
          // petsitterId
          memberId: journal.reservation.client.id,
          createdAt: journal.createdAt,
          lastModifiedAt: journal.updatedAt,
          body: journal.body,
          photos: journal.photos,
          petNames: petNames,
          petPhotos: petPhotos,
          // petsitterName
          // petsitterPhoto
        };
      });
      ctx.send({ journals: modifiedJournals });
    } catch (e) {
      console.log(e);
    }
  },

  // 케어 일지 1개 조회
  async findOne(ctx) {
    try {
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

      const petNames = journal.reservation.pets.map((pet) => pet.name);
      const petPhotos = journal.reservation.pets.map((pet) => pet.file);

      const response = {
        journalId: journal.id,
        reservationId: journal.reservation.id,
        // petsitterId
        memberId: journal.reservation.client.id,
        createdAt: journal.createdAt,
        lastModifiedAt: journal.updatedAt,
        body: journal.body,
        photos: journal.photos,
        petNames: petNames,
        petPhotos: petPhotos,
        // petsitterName
        // petsitterPhoto
      };

      ctx.send(response);
    } catch (e) {
      console.log(e);
    }
  },

  // 케어 일지 등록 (?)
  async create(ctx) {
    try {
      const requestBody = ctx.request.body;
      console.log(requestBody);

      const data = requestBody;

      // response 수정
      // journal > reservation > user > client / petsitter
      // const petsitterId = 30;
      // const memberId = 1;

      const createdAt = new Date().toISOString();
      const lastModifiedAt = new Date().toISOString();

      const newJournal = await strapi.entityService.create(
        "api::journal.journal",
        { data }
      );

      const response = "Create Journal Success";
      // journalId: newJournal.id,
      // reservationId: data.reservationId,
      // petsitterId,
      // memberId,
      // createdAt,
      // lastModifiedAt,
      // body: data.body,
      // photos: data.photos,

      ctx.send(response);
    } catch (e) {
      console.log(e);
    }
  },

  // 케어 일지 수정
  async update(ctx) {
    try {
      const { journalId } = ctx.params;
      const requestBody = ctx.request.body;
      console.log(requestBody);
      const data = requestBody;

      // response 수정
      const petsitterId = 30;
      const memberId = 1;
      const createdAt = requestBody.createdAt;
      const lastModifiedAt = new Date().toISOString();

      const updatedJournal = await strapi.entityService.update(
        "api::journal.journal",
        journalId,
        requestBody
      );

      const response = {
        journalId: journalId,
        reservationId: data.reservationId,
        petsitterId,
        memberId,
        createdAt,
        lastModifiedAt,
        body: data.body,
        photos: data.photos,
      };
      ctx.send(updatedJournal);
    } catch (e) {
      console.log(e);
    }
  },
}));
