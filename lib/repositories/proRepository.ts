import {
  memberTrainingForReview,
  proMembers,
  proMetrics,
  proRooms,
  sharedRecordForReview
} from "@/lib/mock/pro";

export const proRepository = {
  getDashboardMetrics() {
    return proMetrics;
  },

  getRooms() {
    return proRooms;
  },

  getMembers() {
    return proMembers;
  },

  getSharedRecordForReview() {
    return sharedRecordForReview;
  },

  getMemberTrainingForReview() {
    return memberTrainingForReview;
  }
};
