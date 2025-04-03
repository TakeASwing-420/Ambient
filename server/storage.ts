import { 
  users, type User, type InsertUser,
  audioUploads, type AudioUpload, type InsertAudioUpload,
  lofiTracks, type LofiTrack, type InsertLofiTrack
} from "@shared/schema";
import { insertAudioUploadSchema, insertLofiTrackSchema } from "@shared/schema";

export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Audio uploads
  getAudioUpload(id: number): Promise<AudioUpload | undefined>;
  createAudioUpload(upload: InsertAudioUpload): Promise<AudioUpload>;
  
  // Lofi tracks
  getLofiTrack(id: number): Promise<LofiTrack | undefined>;
  getLofiTracksBySourceAudio(sourceAudioId: number): Promise<LofiTrack[]>;
  createLofiTrack(track: InsertLofiTrack): Promise<LofiTrack>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private audioUploads: Map<number, AudioUpload>;
  private lofiTracks: Map<number, LofiTrack>;
  
  private userIdCounter: number;
  private audioUploadIdCounter: number;
  private lofiTrackIdCounter: number;

  constructor() {
    this.users = new Map();
    this.audioUploads = new Map();
    this.lofiTracks = new Map();
    
    this.userIdCounter = 1;
    this.audioUploadIdCounter = 1;
    this.lofiTrackIdCounter = 1;
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
  
  // Audio upload methods
  async getAudioUpload(id: number): Promise<AudioUpload | undefined> {
    return this.audioUploads.get(id);
  }
  
  async createAudioUpload(upload: InsertAudioUpload): Promise<AudioUpload> {
    // Validate data
    const validatedData = insertAudioUploadSchema.parse(upload);
    
    // Generate ID and create timestamp
    const id = this.audioUploadIdCounter++;
    const uploadedAt = new Date();
    
    // Create new record
    const audioUpload: AudioUpload = {
      ...validatedData,
      id,
      uploadedAt
    };
    
    // Store in map
    this.audioUploads.set(id, audioUpload);
    
    return audioUpload;
  }
  
  // Lofi track methods
  async getLofiTrack(id: number): Promise<LofiTrack | undefined> {
    return this.lofiTracks.get(id);
  }
  
  async getLofiTracksBySourceAudio(sourceAudioId: number): Promise<LofiTrack[]> {
    return Array.from(this.lofiTracks.values()).filter(
      (track) => track.sourceAudioId === sourceAudioId
    );
  }
  
  async createLofiTrack(track: InsertLofiTrack): Promise<LofiTrack> {
    // Validate data
    const validatedData = insertLofiTrackSchema.parse(track);
    
    // Generate ID and create timestamp
    const id = this.lofiTrackIdCounter++;
    const createdAt = new Date();
    
    // Create new record
    const lofiTrack: LofiTrack = {
      ...validatedData,
      id,
      createdAt
    };
    
    // Store in map
    this.lofiTracks.set(id, lofiTrack);
    
    return lofiTrack;
  }
}

export const storage = new MemStorage();
