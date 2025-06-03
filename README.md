# STG-44 Discord Landing Page

A gradient-styled landing page with Discord server join functionality and comprehensive visitor analytics.

## Features

- 🎨 Purple-blue gradient background design
- 🎯 Large STG-44 branding with "THAT'S ALL" tagline
- 🔗 Discord server join button (https://discord.gg/fb4EwFmQyt)
- 📊 Real-time visitor analytics with bar charts
- 🌍 Location tracking (IP, country, city, region)
- 🖥️ Browser and platform detection
- 📢 Discord webhook notifications for every visit
- ⏰ Uptime monitoring with health checks

## Deployment on Render

### 1. Deploy to Render

1. Connect your repository to Render
2. Use the provided `render.yaml` configuration
3. Set environment variables:
   - `DISCORD_WEBHOOK_URL`: Your Discord webhook URL
   - `NODE_ENV`: production
   - `PORT`: 10000

### 2. Uptime Monitoring

The application includes several monitoring endpoints:

- **Health Check**: `/health` - Complete server health status
- **Uptime Stats**: `/api/uptime` - Server uptime information
- **Visit Analytics**: `/api/visits/stats` - Visitor statistics

### 3. External Monitoring Services

Configure these services to monitor your deployed app:

#### UptimeRobot
- URL to Monitor: `https://your-app.onrender.com/health`
- Check Type: HTTP(s)
- Monitoring Interval: 5 minutes

#### StatusCake
- Test URL: `https://your-app.onrender.com/health`
- Check Rate: 5 minutes
- Test Type: HTTP

#### Pingdom
- URL: `https://your-app.onrender.com/health`
- Check interval: 5 minutes

## Analytics Features

### Visitor Tracking
- IP address detection (server-side for accuracy)
- Geographic location (country, city, region)
- Browser and platform information
- Referrer tracking
- Real-time visit counting

### Discord Integration
Every visitor triggers a Discord webhook notification with:
- Visitor location details
- Browser information
- Total visit count
- Timestamp

### Charts and Statistics
- 7-day visitor trend chart
- Real-time total visit counter
- Daily visit breakdown

## Environment Variables

```env
NODE_ENV=production
PORT=10000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1379160515175252049/0bdHg0JbH3d1POYn_cDS-XZRwtbY1AJv2thwO2AVXgt_V19Y0aRgyLA-UWn1_O8SFTDf
```

## API Endpoints

- `GET /health` - Health check with uptime stats
- `GET /api/uptime` - Server uptime information
- `GET /api/visits/stats` - Visit statistics for charts
- `POST /api/visits` - Track new visitor (automatically called)

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```