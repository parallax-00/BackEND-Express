//! Files will be uploaded to Cloudinary via 2 step process, first the user will upload the file which we will temporary keep on our servers and then upload it on Cloudinary making it 2 step process. After successful uplaod to Cloudinary the files will be removed from the Server.

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Upload a File
const uploadOnCloudinary = async (localFilePath) => {
  try {
    //* No file path-> return null
    if (!localFilePath) return null;
    //* Upload the file on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //* Removing the file from local server
    // console.log("File is uploaded on Cloudinary ", uploadResult.url);
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    //* !localFilePath -> return null ---- if true then we are sure that file is on the local server then process is handled in try {} if it fails, then catch{} *File is on local server but cant be uploaded on Cloudinary* thus for safe keeping the server and security reasons unlink the file from the server.
    fs.unlinkSync(localFilePath);
    return null;
  }
};
export { uploadOnCloudinary };
