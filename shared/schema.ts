import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// The original users table from the template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New table for audio uploads
export const audioUploads = pgTable("audio_uploads", {
  id: serial("id").primaryKey(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  storageKey: text("storage_key").notNull(),
});

export const insertAudioUploadSchema = createInsertSchema(audioUploads).pick({
  originalFilename: true,
  fileSize: true,
  mimeType: true,
  storageKey: true,
});

export type InsertAudioUpload = z.infer<typeof insertAudioUploadSchema>;
export type AudioUpload = typeof audioUploads.$inferSelect;

// Table for generated lofi tracks
export const lofiTracks = pgTable("lofi_tracks", {
  id: serial("id").primaryKey(),
  sourceAudioId: integer("source_audio_id").notNull(),
  parameters: json("parameters").notNull().$type<{
    chillLevel: number;
    beatIntensity: number;
    vintageEffect: number;
    mood: string;
  }>(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  filename: text("filename").notNull(),
});

export const insertLofiTrackSchema = createInsertSchema(lofiTracks).pick({
  sourceAudioId: true,
  parameters: true,
  storageKey: true,
  filename: true,
});

export type InsertLofiTrack = z.infer<typeof insertLofiTrackSchema>;
export type LofiTrack = typeof lofiTracks.$inferSelect;
