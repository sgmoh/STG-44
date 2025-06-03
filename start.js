const express = require('express');
const path = require('path');
const { createServer } = require('http');

// Import the routes setup
const { storage } = require('./server/storage.ts');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Health check endpoint
app.get('/health', async (req, res) => {
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

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  }
});

const PORT = parseInt(process.env.PORT || '10000');
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`STG-44 server running on port ${PORT}`);
});