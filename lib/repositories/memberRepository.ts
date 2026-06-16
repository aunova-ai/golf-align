import {
  latestFeedback,
  recentRecords,
  roomSummary,
  todayTrainings
} from "@/lib/mock/member";

export const memberRepository = {
  getLatestFeedback() {
    return latestFeedback;
  },

  getTodayTrainings() {
    return todayTrainings;
  },

  getRecentRecords() {
    return recentRecords;
  },

  getRoomSummary() {
    return roomSummary;
  }
};
