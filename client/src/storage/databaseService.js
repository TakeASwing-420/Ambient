import { appwriteDatabases, account, ID, Permission, Role } from './appwriteConfig';

export async function appwriteDatabase(audioFileId, videoFileId, videoFileDuration) {
  try {
    const user = await account.get();
    const userId = user.$id;

    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.write(Role.user(userId))
    ];

    const now = new Date();

    const response = await appwriteDatabases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
      ID.unique(),
      {
        audio: audioFileId,
        video: videoFileId,
        trackName: now.toISOString(),
        duration: videoFileDuration,
        clientID: userId,
      },
      permissions
    );

    return response;
  } catch (error) {
    console.error("Error creating track document:", error);
    throw error;
  }
}
