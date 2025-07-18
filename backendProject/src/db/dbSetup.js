//! Mainly used for establishing database connection
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MONGODB connected without any error!! DB HOST: ${connectionInstance.connection.host} `
    );
  } catch (error) {
    console.error("Error in bd/dbSetup :: connectDB: ", error);
    process.exit(1);
  }
};

export default connectDB;
