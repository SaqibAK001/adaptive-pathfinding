import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

export const trainRL = (scenario = "static") => API.post("/train", { scenario });

export const runAllAlgorithms = (payload) => API.post("/run_all", payload);