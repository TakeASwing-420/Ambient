import { storage, ID, account, Permission, Role } from './appwriteConfig';

export async function appwriteStorage(file) {
  try {
    const user = await account.get();
    const userId = user.$id;

    const permissions = [
      // Permission.read(Role.user(userId)),
      Permission.read('any'),
      Permission.write(Role.user(userId))
    ];

    const response = await storage.createFile(
      import.meta.env.VITE_APPWRITE_BUCKET_ID,
      ID.unique(),
      file,
      permissions
    );

    return response;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
