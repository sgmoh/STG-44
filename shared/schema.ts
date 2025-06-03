import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
  region: text("region"),
  countryCode: text("country_code"),
  timezone: text("timezone"),
  browser: text("browser"),
  platform: text("platform"),
  language: text("language"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  visitedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;
