"use strict";

/**
 * reservation router
 */

// const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = {
  routes: [
    // 펫시터 예약 확정
    {
      method: "PUT",
      path: "/reservations/:reservationId/confirm",
      handler: "reservation.confirmReservation",
    },
    // 펫시터 예약 취소
    {
      method: "PUT",
      path: "/reservations/:reservationId/petsittercancel",
      handler: "reservation.petsitterCancel",
    },
    // 멤버 예약 취소
    {
      method: "PUT",
      path: "/reservations/:reservationId/membercancel",
      handler: "reservation.memberCancel",
    },
    // 예약 가능 펫시터 찾기
    {
      method: "POST",
      path: "/reservations/petsitters",
      handler: "reservation.findPossiblePetsitter",
    },
  ],
};
