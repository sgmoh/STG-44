const express = require('express');
const { createServer } = require('http');
const path = require('path');

// In-memory storage for production
class MemStorage {
  constructor() {
    this.visits = new Map();
    this.currentVisitId = 1;
    this.uptimeChecks = [];
    this.serverStartTime = new Date();
  }

  async createVisit(visitData) {
    const id = this.currentVisitId++;
    const visit = {
      id,
      ip: visitData.ip || null,
      country: visitData.country || null,
      city: visitData.city || null,
      region: visitData.region || null,
      countryCode: visitData.countryCode || null,
      timezone: visitData.timezone || null,
      browser: visitData.browser || null,
      platform: visitData.platform || null,
      language: visitData.language || null,
      userAgent: visitData.userAgent || null,
      referrer: visitData.referrer || null,
      visitedAt: new Date()
    };
    this.visits.set(id, visit);
    return visit;
  }

  async getVisits() {
    return Array.from(this.visits.values());
  }

  async getVisitsByDateRange(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return Array.from(this.visits.values()).filter(
      visit => visit.visitedAt >= cutoffDate
    );
  }

  async getTotalVisits() {
    return this.visits.size;
  }

  async recordUptime() {
    this.uptimeChecks.push(new Date());
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.uptimeChecks = this.uptimeChecks.filter(check => check > twentyFourHoursAgo);
  }

  async getUptimeStats() {
    const now = new Date();
    const totalRunTime = now.getTime() - this.serverStartTime.getTime();
    const uptimeHours = totalRunTime / (1000 * 60 * 60);
    
    return {
      uptime: Math.round(uptimeHours * 100) / 100,
      lastCheck: this.uptimeChecks.length > 0 ? this.uptimeChecks[this.uptimeChecks.length - 1] : this.serverStartTime
    };
  }
}

const storage = new MemStorage();

async function setupRoutes(app) {
  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      await storage.recordUptime();
      const totalVisits = await storage.getTotalVisits();
      const uptimeStats = await storage.getUptimeStats();
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        totalVisits,
        uptimeHours: uptimeStats.uptime,
        lastCheck: uptimeStats.lastCheck,
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service unavailable"
      });
    }
  });

  // Uptime statistics endpoint
  app.get("/api/uptime", async (req, res) => {
    try {
      const uptimeStats = await storage.getUptimeStats();
      res.json({
        uptime: uptimeStats.uptime,
        lastCheck: uptimeStats.lastCheck,
        serverStatus: "online"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get uptime statistics" });
    }
  });

  // Track a new visit
  app.post("/api/visits", async (req, res) => {
    try {
      const clientData = req.body;
      
      // Get real IP address from headers
      const realIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    clientData.ip;
      
      const visitData = {
        ...clientData,
        ip: Array.isArray(realIP) ? realIP[0] : realIP?.toString()
      };
      
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

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (!response.ok) {
          console.error('Discord webhook failed:', response.status);
        }
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
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup API routes
  await setupRoutes(app);

  // Serve static files from client directory
  const clientPath = path.join(__dirname, '..', 'client');
  app.use(express.static(clientPath));

  // Serve index.html for all other routes (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });

  const server = createServer(app);
  const PORT = parseInt(process.env.PORT || '5000');
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`STG-44 Discord landing page serving on port ${PORT}`);
  });

  return server;
}

startServer().catch(console.error);