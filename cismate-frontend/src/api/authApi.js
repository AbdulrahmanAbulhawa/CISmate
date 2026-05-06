import axiosClient from "./axiosClient";

export const loginUser = (loginData) => {
  return axiosClient.post("/login", loginData);
};

export const registerUser = (registerData) => {
  return axiosClient.post("/api/register", registerData);
};