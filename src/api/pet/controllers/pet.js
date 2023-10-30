"use strict";

/**
 * pet controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::pet.pet", ({ strapi }) => ({
  async find(ctx) {
    // pet 전체 조회
    try {
      const pets = await strapi.entityService.findMany("api::pet.pet", {
        fields: [
          "name",
          "type",
          "age",
          "weight",
          "neutering",
          "male",
          "species",
          "body",
          "createdAt",
          "updatedAt", //마지막 수정 날짜
        ],
        populate: {
          file: {
            fields: ["formats"],
          },
        },
      });

      console.log(pets);

      const modifiedPets = pets.map((pet) => ({
        petId: pet.id,
        name: pet.name,
        type: pet.type,
        age: pet.age,
        species: pet.species,
        weight: pet.weight,
        body: pet.body,
        male: pet.male,
        neutering: pet.neutering,
        createdAt: pet.createdAt,
        lastModifiedAt: pet.updatedAt,
        photo: pet.file
          ? pet.file.map((photo) => ({
              id: photo.id,
              thumnail: photo.formats.thumbnail,
            }))
          : null,
      }));
      ctx.send(modifiedPets);
    } catch (e) {
      console.error(e);
    }
  },

  async findOne(ctx) {
    // 특정 pet 조회
    try {
      const pet = await strapi.entityService.findOne(
        "api::pet.pet",
        ctx.params.id,
        {
          fields: [
            "name",
            "type",
            "age",
            "weight",
            "neutering",
            "male",
            "species",
            "body",
            "createdAt",
            "updatedAt", //마지막 수정 날짜
          ],
          populate: {
            file: {
              fields: ["formats"],
            },
          },
        }
      );

      console.log(pet);

      const modifiedPet = {
        petId: pet.id,
        name: pet.name,
        type: pet.type,
        age: pet.age,
        species: pet.species,
        weight: pet.weight,
        body: pet.body,
        male: pet.male,
        neutering: pet.neutering,
        createdAt: pet.createdAt,
        lastModifiedAt: pet.updatedAt,
        photo: pet.file
          ? pet.file.map((photo) => ({
              id: photo.id,
              thumnail: photo.formats.thumbnail,
            }))
          : null,
      };
      ctx.send(modifiedPet);
    } catch (e) {
      console.error(e);
    }
  },
}));
