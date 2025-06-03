import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Track a new visit
  app.post("/api/visits", async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse(req.body);
      const visit = await storage.createVisit(visitData);
      
      // Send data to Discord webhook
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1379160515175252049/0bdHg0JbH3d1POYn_cDS-XZRwtbY1AJv2thwO2AVXgt_V19Y0aRgyLA-UWn1_O8SFTDf";
        
        const webhookData = {
          embeds: [{
            title: "🔥 New STG-44 Website Visit",
            color: 0x8B5CF6,
            fields: [
              {
                name: "📍 Location Info",
                value: `**IP:** ${visit.ip || 'Unknown'}\n**Country:** ${visit.country || 'Unknown'}\n**City:** ${visit.city || 'Unknown'}\n**Region:** ${visit.region || 'Unknown'}`,
                inline: true
              },
              {
                name: "🌐 Browser Info",
                value: `**Browser:** ${visit.browser || 'Unknown'}\n**Platform:** ${visit.platform || 'Unknown'}\n**Language:** ${visit.language || 'Unknown'}`,
                inline: true
              },
              {
                name: "📊 Visit Stats",
                value: `**Total Visits:** ${await storage.getTotalVisits()}\n**Referrer:** ${visit.referrer || 'Direct'}`,
                inline: false
              }
            ],
            footer: {
              text: `Visit recorded at ${visit.visitedAt.toLocaleString()}`
            }
          }]
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });
      } catch (webhookError) {
        console.error('Failed to send webhook:', webhookError);
      }

      res.json(visit);
    } catch (error) {
      res.status(400).json({ error: "Invalid visit data" });
    }
  });

  // Get visit statistics
  app.get("/api/visits/stats", async (req, res) => {
    try {
      const totalVisits = await storage.getTotalVisits();
      const recentVisits = await storage.getVisitsByDateRange(7);
      
      // Group visits by day for the last 7 days
      const dailyVisits = Array(7).fill(0);
      const labels = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayVisits = recentVisits.filter(visit => {
          const visitDate = new Date(visit.visitedAt);
          return visitDate >= date && visitDate < nextDate;
        }).length;
        
        dailyVisits[6 - i] = dayVisits;
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }

      res.json({
        total: totalVisits,
        daily: dailyVisits,
        labels
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get visit statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
