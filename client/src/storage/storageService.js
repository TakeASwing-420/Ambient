import { storage, ID } from './appwriteConfig';

export async function uploadFileToStorage(file) {
  try {
    const response = await storage.createFile(
      import.meta.env.VITE_APPWRITE_BUCKET_ID,
      ID.unique(),
      file
    );
    return response;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}