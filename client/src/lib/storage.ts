export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Video uploads
  getVideoUpload(id: number): Promise<VideoUpload | undefined>;
  createVideoUpload(upload: InsertVideoUpload): Promise<VideoUpload>;
  
  // Lofi videos
  getLofiVideo(id: number): Promise<LofiVideo | undefined>;
  getLofiVideosBySourceVideo(sourceVideoId: number): Promise<LofiVideo[]>;
  createLofiVideo(video: InsertLofiVideo): Promise<LofiVideo>;
}

// Types
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

interface InsertUser {
  username: string;
  email: string;
}

interface VideoUpload {
  id: number;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  createdAt: Date;
}

interface InsertVideoUpload {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

interface LofiVideo {
  id: number;
  sourceVideoId: number;
  musicParams: string;
  outputPath: string;
  title: string;
  createdAt: Date;
}

interface InsertLofiVideo {
  sourceVideoId: number;
  musicParams: string;
  outputPath: string;
  title: string;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videoUploads: Map<number, VideoUpload>;
  private lofiVideos: Map<number, LofiVideo>;
  
  private userIdCounter: number;
  private videoUploadIdCounter: number;
  private lofiVideoIdCounter: number;

  constructor() {
    this.users = new Map();
    this.videoUploads = new Map();
    this.lofiVideos = new Map();
    this.userIdCounter = 1;
    this.videoUploadIdCounter = 1;
    this.lofiVideoIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getVideoUpload(id: number): Promise<VideoUpload | undefined> {
    return this.videoUploads.get(id);
  }

  async createVideoUpload(upload: InsertVideoUpload): Promise<VideoUpload> {
    const id = this.videoUploadIdCounter++;
    const videoUpload: VideoUpload = {
      ...upload,
      id,
      createdAt: new Date()
    };
    this.videoUploads.set(id, videoUpload);
    return videoUpload;
  }

  async getLofiVideo(id: number): Promise<LofiVideo | undefined> {
    return this.lofiVideos.get(id);
  }

  async getLofiVideosBySourceVideo(sourceVideoId: number): Promise<LofiVideo[]> {
    return Array.from(this.lofiVideos.values()).filter(
      video => video.sourceVideoId === sourceVideoId
    );
  }

  async createLofiVideo(track: InsertLofiVideo): Promise<LofiVideo> {
    const id = this.lofiVideoIdCounter++;
    const lofiVideo: LofiVideo = {
      ...track,
      id,
      createdAt: new Date()
    };
    this.lofiVideos.set(id, lofiVideo);
    return lofiVideo;
  }
}

export const storage = new MemStorage();