import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import fs from "fs";
import { promisify } from "util";
import envVariables from "../config";

// Promisify `unlink` to handle it asynchronously
const unlinkFile = promisify(fs.unlink);

cloudinary.config({
  cloud_name: envVariables.cloudinary.cloudName,
  api_key: envVariables.cloudinary.apiKey,
  api_secret: envVariables.cloudinary.apiSecret,
});

const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
        folder: "skillswave-auth",
      }
    );

    // Remove the local file after a successful upload
    await unlinkFile(localFilePath);
    return response;
  } catch (error) {
    // Type guard to check if the error is an UploadApiErrorResponse
    if ((error as UploadApiErrorResponse).http_code) {
      console.error(
        "Cloudinary upload error:",
        (error as UploadApiErrorResponse).message
      );
    } else {
      console.error("Unexpected error:", error);
    }

    // Remove the file if an error occurs
    await unlinkFile(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
