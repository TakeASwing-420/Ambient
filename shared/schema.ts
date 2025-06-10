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

// Table for video uploads
export const videoUploads = pgTable("video_uploads", {
  id: serial("id").primaryKey(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  storageKey: text("storage_key").notNull(),
});

export const insertVideoUploadSchema = createInsertSchema(videoUploads).pick({
  originalFilename: true,
  fileSize: true,
  mimeType: true,
  storageKey: true,
});

export type InsertVideoUpload = z.infer<typeof insertVideoUploadSchema>;
export type VideoUpload = typeof videoUploads.$inferSelect;

// Table for generated lofi videos
export const lofiVideos = pgTable("lofi_videos", {
  id: serial("id").primaryKey(),
  sourceVideoId: integer("source_video_id").notNull(),
  musicParameters: json("music_parameters").notNull().$type<{
    title?: string;
    key: number;
    mode: number;
    bpm: number;
    energy: number;
    valence: number;
    swing: number;
    chords: number[];
    melodies: number[][];
  }>(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  filename: text("filename").notNull(),
});

export const insertLofiVideoSchema = createInsertSchema(lofiVideos).pick({
  sourceVideoId: true,
  musicParameters: true,
  storageKey: true,
  filename: true,
});

export type InsertLofiVideo = z.infer<typeof insertLofiVideoSchema>;
export type LofiVideo = typeof lofiVideos.$inferSelect;
