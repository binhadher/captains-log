import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch weather for Dubai
    const response = await fetch('https://wttr.in/Dubai?format=j1', {
      headers: { 'User-Agent': 'curl' },
      next: { revalidate: 1800 } // Cache for 30 minutes
    });
    
    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }
    
    const data = await response.json();
    const current = data.current_condition[0];
    
    return NextResponse.json({
      temp: current.temp_C,
      feelsLike: current.FeelsLikeC,
      condition: current.weatherDesc[0].value,
      humidity: current.humidity,
      windSpeed: current.windspeedKmph,
      windDir: current.winddir16Point,
      icon: getWeatherIcon(current.weatherCode),
      location: 'Dubai'
    });
  } catch (error) {
    console.error('Weather error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

function getWeatherIcon(code: string): string {
  const codeNum = parseInt(code);
  if (codeNum === 113) return '☀️';
  if (codeNum === 116) return '⛅';
  if (codeNum === 119 || codeNum === 122) return '☁️';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(codeNum)) return '🌧️';
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(codeNum)) return '🌨️';
  if ([200, 386, 389, 392, 395].includes(codeNum)) return '⛈️';
  if ([143, 248, 260].includes(codeNum)) return '🌫️';
  return '🌤️';
}
