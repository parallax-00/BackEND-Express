// require("dotenv").config({ path: "./env" }); //! Does not work properly with module JS
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import connectDB from "./db/dbSetup.js";
import app from "./app.js";
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3010, () => {
      console.log(`Server is serving on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "MongoDB connection failed. Error in ./index.js :: connectDB(): ",
      err
    );
  });
