// require("dotenv").config({ path: "./env" }); //! Does not work properly with module JS
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import connectDB from "./db/dbSetup.js";
connectDB();
