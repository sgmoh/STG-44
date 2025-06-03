import { users, visits, type User, type InsertUser, type Visit, type InsertVisit } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  getVisits(): Promise<Visit[]>;
  getVisitsByDateRange(days: number): Promise<Visit[]>;
  getTotalVisits(): Promise<number>;
  recordUptime(): Promise<void>;
  getUptimeStats(): Promise<{ uptime: number; lastCheck: Date }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private visits: Map<number, Visit>;
  private currentUserId: number;
  private currentVisitId: number;
  private uptimeChecks: Date[];
  private serverStartTime: Date;

  constructor() {
    this.users = new Map();
    this.visits = new Map();
    this.currentUserId = 1;
    this.currentVisitId = 1;
    this.uptimeChecks = [];
    this.serverStartTime = new Date();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const id = this.currentVisitId++;
    const visit: Visit = { 
      id,
      ip: insertVisit.ip || null,
      country: insertVisit.country || null,
      city: insertVisit.city || null,
      region: insertVisit.region || null,
      countryCode: insertVisit.countryCode || null,
      timezone: insertVisit.timezone || null,
      browser: insertVisit.browser || null,
      platform: insertVisit.platform || null,
      language: insertVisit.language || null,
      userAgent: insertVisit.userAgent || null,
      referrer: insertVisit.referrer || null,
      visitedAt: new Date() 
    };
    this.visits.set(id, visit);
    return visit;
  }

  async getVisits(): Promise<Visit[]> {
    return Array.from(this.visits.values());
  }

  async getVisitsByDateRange(days: number): Promise<Visit[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.visits.values()).filter(
      visit => visit.visitedAt >= cutoffDate
    );
  }

  async getTotalVisits(): Promise<number> {
    return this.visits.size;
  }

  async recordUptime(): Promise<void> {
    this.uptimeChecks.push(new Date());
    // Keep only last 24 hours of checks
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.uptimeChecks = this.uptimeChecks.filter(check => check > twentyFourHoursAgo);
  }

  async getUptimeStats(): Promise<{ uptime: number; lastCheck: Date }> {
    const now = new Date();
    const totalRunTime = now.getTime() - this.serverStartTime.getTime();
    const uptimeHours = totalRunTime / (1000 * 60 * 60);
    
    return {
      uptime: Math.round(uptimeHours * 100) / 100,
      lastCheck: this.uptimeChecks.length > 0 ? this.uptimeChecks[this.uptimeChecks.length - 1] : this.serverStartTime
    };
  }
}

export const storage = new MemStorage();
