import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';

interface VisitStats {
  total: number;
  daily: number[];
  labels: string[];
}

interface VisitorData {
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  timezone?: string;
  browser?: string;
  platform?: string;
  language?: string;
  userAgent?: string;
  referrer?: string;
}

export default function Home() {
  const [chartInitialized, setChartInitialized] = useState(false);

  // Fetch visit statistics
  const { data: visitStats, isLoading } = useQuery<VisitStats>({
    queryKey: ['/api/visits/stats'],
  });

  // Track visit mutation
  const trackVisitMutation = useMutation({
    mutationFn: async (visitData: VisitorData) => {
      const response = await apiRequest('POST', '/api/visits', visitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visits/stats'] });
    },
  });

  // Helper function to get browser name
  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  };

  // Collect visitor data and track visit
  const collectAndTrackVisit = async () => {
    try {
      // Get basic browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      };

      // Get page info
      const pageInfo = {
        referrer: document.referrer,
      };

      let locationInfo: any = {};
      
      // Get IP and location info - try multiple services for accuracy
      try {
        // First try ipapi.co
        let response = await fetch('https://ipapi.co/json/');
        let ipData = await response.json();
        
        // If ipapi.co fails or returns invalid data, try backup service
        if (!ipData.ip || ipData.error) {
          response = await fetch('https://api.ipify.org?format=json');
          const ipifyData = await response.json();
          
          // Get detailed location from ip-api.com
          const locationResponse = await fetch(`http://ip-api.com/json/${ipifyData.ip}`);
          const locationData = await locationResponse.json();
          
          ipData = {
            ip: ipifyData.ip,
            city: locationData.city,
            region: locationData.regionName,
            country_name: locationData.country,
            country_code: locationData.countryCode,
            timezone: locationData.timezone
          };
        }
        
        locationInfo = {
          ip: ipData.ip,
          city: ipData.city,
          region: ipData.region || ipData.regionName,
          country: ipData.country_name || ipData.country,
          countryCode: ipData.country_code || ipData.countryCode,
          timezone: ipData.timezone
        };
      } catch (error) {
        console.log('Could not fetch IP/location data:', error);
        // Fallback to basic detection
        try {
          const fallbackResponse = await fetch('https://httpbin.org/ip');
          const fallbackData = await fallbackResponse.json();
          locationInfo = { ip: fallbackData.origin };
        } catch (fallbackError) {
          console.log('All IP detection methods failed:', fallbackError);
        }
      }

      // Prepare visit data
      const visitData: VisitorData = {
        ...locationInfo,
        browser: getBrowserName(browserInfo.userAgent),
        platform: browserInfo.platform,
        language: browserInfo.language,
        userAgent: browserInfo.userAgent,
        referrer: pageInfo.referrer || undefined,
      };

      // Track the visit
      trackVisitMutation.mutate(visitData);
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  // Initialize chart when data is available
  useEffect(() => {
    if (visitStats && !chartInitialized && typeof window !== 'undefined') {
      // Load Chart.js dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        const ctx = (document.getElementById('visitChart') as HTMLCanvasElement)?.getContext('2d');
        if (ctx && (window as any).Chart) {
          new (window as any).Chart(ctx, {
            type: 'bar',
            data: {
              labels: visitStats.labels,
              datasets: [{
                label: 'Daily Visits',
                data: visitStats.daily,
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    stepSize: 1
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              }
            }
          });
          setChartInitialized(true);
        }
      };
      document.head.appendChild(script);
    }
  }, [visitStats, chartInitialized]);

  // Track visit on component mount
  useEffect(() => {
    collectAndTrackVisit();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 font-inter">
      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* STG-44 Branding */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg">
            STG-44
          </h1>
          <p className="text-xl text-gray-200 opacity-90">THAT'S ALL</p>
        </div>

        {/* Join Server Button */}
        <div className="mb-12">
          <a 
            href="https://discord.gg/fb4EwFmQyt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-indigo-500"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
            </svg>
            Join Server
          </a>
        </div>

        {/* Visit Statistics */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 w-full max-w-md">
          <h3 className="text-white text-lg font-semibold mb-4 text-center">Visit Statistics</h3>
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-white">
              {isLoading ? '...' : visitStats?.total || 0}
            </span>
            <span className="text-gray-300 ml-2">Total Visits</span>
          </div>
          <div className="w-full h-48">
            <canvas id="visitChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
