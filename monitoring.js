// Uptime monitoring script for external services like UptimeRobot or StatusCake
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || 'https://your-app.onrender.com/health';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1379160515175252049/0bdHg0JbH3d1POYn_cDS-XZRwtbY1AJv2thwO2AVXgt_V19Y0aRgyLA-UWn1_O8SFTDf';

async function checkHealth() {
  try {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      console.log(`✅ Service is healthy - Uptime: ${data.uptimeHours}h - Total Visits: ${data.totalVisits}`);
      return { status: 'healthy', data };
    } else {
      throw new Error(`Health check failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    // Send alert to Discord
    await sendDiscordAlert(error.message);
    return { status: 'unhealthy', error: error.message };
  }
}

async function sendDiscordAlert(error) {
  try {
    const alertData = {
      embeds: [{
        title: "🚨 STG-44 Server Alert",
        description: `Server health check failed`,
        color: 0xFF0000, // Red color
        fields: [
          {
            name: "Error",
            value: error,
            inline: false
          },
          {
            name: "Timestamp",
            value: new Date().toISOString(),
            inline: true
          },
          {
            name: "Action Required",
            value: "Check server status and restart if necessary",
            inline: false
          }
        ]
      }]
    };

    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  } catch (webhookError) {
    console.error('Failed to send Discord alert:', webhookError);
  }
}

// Run health check
if (require.main === module) {
  checkHealth();
}

module.exports = { checkHealth, sendDiscordAlert };