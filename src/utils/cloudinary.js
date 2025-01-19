import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
// Cloudinary configuration
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const extractPublicIdFromUrl = (url) => {
  const regex = /\/v[0-9]+\/(.+)\..+$/; // Matches the public ID in Cloudinary URL
  const match = url.match(regex);
  return match ? match[1] : null;
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    })

    console.log("File uploaded on cloudinary. File src: " + response.url);
    fs.unlinkSync(localFilePath);
    return response; 
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try{
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("File deleted from cloudinary", result);
      return result; 
  }catch(error){
    console.log("Error deleting file from cloudinary", error); 
    return null; 
  }
}

const deleteFromCloudinaryUsingUrl = async (url) => {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) {
    return null;
  }
  return await deleteFromCloudinary(publicId);
}

export { uploadOnCloudinary, deleteFromCloudinary, deleteFromCloudinaryUsingUrl};
