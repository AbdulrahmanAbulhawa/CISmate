import axiosClient from "./axiosClient";

export const sendChatMessage = (chatData) => {
  return axiosClient.post("/api/chat_bot", chatData);
};