import { 
  users, type User, type InsertUser,
  videoUploads, type VideoUpload, type InsertVideoUpload,
  lofiVideos, type LofiVideo, type InsertLofiVideo
} from "@shared/schema";
import { insertVideoUploadSchema, insertLofiVideoSchema } from "@shared/schema";

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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Video upload methods
  async getVideoUpload(id: number): Promise<VideoUpload | undefined> {
    return this.videoUploads.get(id);
  }

  async createVideoUpload(upload: InsertVideoUpload): Promise<VideoUpload> {
    const id = this.videoUploadIdCounter++;
    const videoUpload: VideoUpload = {
      id,
      ...upload,
      uploadedAt: new Date()
    };
    this.videoUploads.set(id, videoUpload);
    return videoUpload;
  }

  // Lofi video methods
  async getLofiVideo(id: number): Promise<LofiVideo | undefined> {
    return this.lofiVideos.get(id);
  }

  async getLofiVideosBySourceVideo(sourceVideoId: number): Promise<LofiVideo[]> {
    return Array.from(this.lofiVideos.values()).filter(
      (video) => video.sourceVideoId === sourceVideoId,
    );
  }

  async createLofiVideo(track: InsertLofiVideo): Promise<LofiVideo> {
    const id = this.lofiVideoIdCounter++;
    const lofiVideo: LofiVideo = {
      id,
      sourceVideoId: track.sourceVideoId,
      musicParameters: {
        title: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? (track.musicParameters as any).title 
          : undefined,
        key: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).key) || 1
          : 1,
        mode: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).mode) || 1
          : 1,
        bpm: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).bpm) || 85
          : 85,
        energy: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).energy) || 0.5
          : 0.5,
        valence: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).valence) || 0.5
          : 0.5,
        swing: typeof track.musicParameters === 'object' && track.musicParameters !== null 
          ? Number((track.musicParameters as any).swing) || 0.5
          : 0.5,
        chords: typeof track.musicParameters === 'object' && track.musicParameters !== null && Array.isArray((track.musicParameters as any).chords)
          ? (track.musicParameters as any).chords
          : [],
        melodies: typeof track.musicParameters === 'object' && track.musicParameters !== null && Array.isArray((track.musicParameters as any).melodies)
          ? (track.musicParameters as any).melodies
          : []
      },
      storageKey: track.storageKey,
      filename: track.filename,
      createdAt: new Date()
    };
    this.lofiVideos.set(id, lofiVideo);
    return lofiVideo;
  }
}

export const storage = new MemStorage();