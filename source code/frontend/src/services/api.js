import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Train RL model
export const trainRL = (envMode = "static") => {
  return API.post("/train", {
    env_mode: envMode,
  });
};

// Run all algorithms
export const runAllAlgorithms = (payload) => {
  return API.post("/run-all", payload);
};

export default API;