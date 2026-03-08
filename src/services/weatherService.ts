/**
 * Weather Service
 * Fetches weather data for construction site conditions
 */

export interface WeatherCondition {
  code: number;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: WeatherCondition;
  isDay: boolean;
  updatedAt: Date;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  condition: WeatherCondition;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: Date;
  minTemp: number;
  maxTemp: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  sunrise: Date;
  sunset: Date;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface WeatherAlert {
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  startTime: Date;
  endTime: Date;
}

// Weather conditions suitable for construction
export interface ConstructionSuitability {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'unsafe';
  score: number; // 0-100
  factors: {
    temperature: { rating: 'good' | 'warning' | 'danger'; message: string };
    precipitation: { rating: 'good' | 'warning' | 'danger'; message: string };
    wind: { rating: 'good' | 'warning' | 'danger'; message: string };
    visibility: { rating: 'good' | 'warning' | 'danger'; message: string };
  };
  recommendations: string[];
}

// Weather condition codes and icons mapping
const WEATHER_CONDITIONS: Record<number, { description: string; icon: string }> = {
  0: { description: 'Klar', icon: '☀️' },
  1: { description: 'Überwiegend klar', icon: '🌤️' },
  2: { description: 'Teilweise bewölkt', icon: '⛅' },
  3: { description: 'Bewölkt', icon: '☁️' },
  45: { description: 'Nebel', icon: '🌫️' },
  48: { description: 'Reifnebel', icon: '🌫️' },
  51: { description: 'Leichter Nieselregen', icon: '🌦️' },
  53: { description: 'Nieselregen', icon: '🌦️' },
  55: { description: 'Starker Nieselregen', icon: '🌧️' },
  61: { description: 'Leichter Regen', icon: '🌦️' },
  63: { description: 'Regen', icon: '🌧️' },
  65: { description: 'Starker Regen', icon: '🌧️' },
  71: { description: 'Leichter Schneefall', icon: '🌨️' },
  73: { description: 'Schneefall', icon: '❄️' },
  75: { description: 'Starker Schneefall', icon: '❄️' },
  80: { description: 'Regenschauer', icon: '🌦️' },
  81: { description: 'Starke Regenschauer', icon: '🌧️' },
  82: { description: 'Heftige Regenschauer', icon: '⛈️' },
  85: { description: 'Schneeschauer', icon: '🌨️' },
  86: { description: 'Starke Schneeschauer', icon: '❄️' },
  95: { description: 'Gewitter', icon: '⛈️' },
  96: { description: 'Gewitter mit Hagel', icon: '⛈️' },
  99: { description: 'Starkes Gewitter mit Hagel', icon: '⛈️' },
};

class WeatherService {
  private apiKey: string | null = null;
  private cache: Map<string, { data: WeatherData; expiry: number }> = new Map();
  private cacheDuration = 15 * 60 * 1000; // 15 minutes

  /**
   * Set API key for weather service
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Get weather data for a location
   */
  async getWeather(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // For demo purposes, return mock data
    // In production, this would call Open-Meteo or another weather API
    const mockData = this.generateMockWeatherData(lat, lon);
    
    this.cache.set(cacheKey, {
      data: mockData,
      expiry: Date.now() + this.cacheDuration,
    });

    return mockData;
  }

  /**
   * Get weather by city name
   */
  async getWeatherByCity(city: string): Promise<WeatherData> {
    // In production, geocode the city first
    // For demo, use approximate coordinates for German cities
    const cityCoords: Record<string, { lat: number; lon: number }> = {
      berlin: { lat: 52.52, lon: 13.405 },
      munich: { lat: 48.137, lon: 11.575 },
      hamburg: { lat: 53.551, lon: 9.993 },
      cologne: { lat: 50.937, lon: 6.96 },
      frankfurt: { lat: 50.11, lon: 8.682 },
      düsseldorf: { lat: 51.225, lon: 6.776 },
      stuttgart: { lat: 48.775, lon: 9.182 },
    };

    const coords = cityCoords[city.toLowerCase()] || { lat: 51.165, lon: 10.451 }; // Default to Germany center
    return this.getWeather(coords.lat, coords.lon);
  }

  /**
   * Evaluate construction suitability based on weather
   */
  evaluateConstructionSuitability(weather: CurrentWeather): ConstructionSuitability {
    const factors: ConstructionSuitability['factors'] = {
      temperature: this.evaluateTemperature(weather.temperature),
      precipitation: this.evaluatePrecipitation(weather.condition.code),
      wind: this.evaluateWind(weather.windSpeed),
      visibility: this.evaluateVisibility(weather.visibility),
    };

    // Calculate overall score
    const scores = {
      temperature: factors.temperature.rating === 'good' ? 25 : factors.temperature.rating === 'warning' ? 15 : 0,
      precipitation: factors.precipitation.rating === 'good' ? 30 : factors.precipitation.rating === 'warning' ? 15 : 0,
      wind: factors.wind.rating === 'good' ? 25 : factors.wind.rating === 'warning' ? 15 : 0,
      visibility: factors.visibility.rating === 'good' ? 20 : factors.visibility.rating === 'warning' ? 10 : 0,
    };

    const score = scores.temperature + scores.precipitation + scores.wind + scores.visibility;

    let overall: ConstructionSuitability['overall'];
    if (score >= 90) overall = 'excellent';
    else if (score >= 70) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else if (score >= 30) overall = 'poor';
    else overall = 'unsafe';

    const recommendations = this.getRecommendations(factors, weather);

    return { overall, score, factors, recommendations };
  }

  /**
   * Get weather alerts for location
   */
  async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    // In production, fetch from weather API
    // Return empty for demo
    return [];
  }

  // Private helper methods

  private evaluateTemperature(temp: number): ConstructionSuitability['factors']['temperature'] {
    if (temp >= 5 && temp <= 30) {
      return { rating: 'good', message: 'Ideale Arbeitstemperatur' };
    }
    if (temp >= -5 && temp < 5) {
      return { rating: 'warning', message: 'Kälte - Schutzmaßnahmen erforderlich' };
    }
    if (temp > 30 && temp <= 35) {
      return { rating: 'warning', message: 'Hitze - Regelmäßige Pausen einplanen' };
    }
    return { rating: 'danger', message: temp < -5 ? 'Extreme Kälte - Arbeiten einschränken' : 'Extreme Hitze - Arbeiten einschränken' };
  }

  private evaluatePrecipitation(code: number): ConstructionSuitability['factors']['precipitation'] {
    // Clear or partly cloudy
    if ([0, 1, 2, 3].includes(code)) {
      return { rating: 'good', message: 'Keine Niederschläge' };
    }
    // Light rain or drizzle
    if ([51, 53, 61, 80].includes(code)) {
      return { rating: 'warning', message: 'Leichte Niederschläge - Vorsicht bei Arbeiten' };
    }
    // Heavy rain, snow, or storms
    return { rating: 'danger', message: 'Starke Niederschläge - Außenarbeiten vermeiden' };
  }

  private evaluateWind(windSpeed: number): ConstructionSuitability['factors']['wind'] {
    if (windSpeed < 20) {
      return { rating: 'good', message: 'Ruhige Bedingungen' };
    }
    if (windSpeed < 40) {
      return { rating: 'warning', message: 'Böiger Wind - Vorsicht bei Höhenarbeiten' };
    }
    return { rating: 'danger', message: 'Sturm - Keine Kranarbeiten' };
  }

  private evaluateVisibility(visibility: number): ConstructionSuitability['factors']['visibility'] {
    if (visibility >= 5000) {
      return { rating: 'good', message: 'Gute Sicht' };
    }
    if (visibility >= 1000) {
      return { rating: 'warning', message: 'Eingeschränkte Sicht' };
    }
    return { rating: 'danger', message: 'Schlechte Sicht - Erhöhte Vorsicht' };
  }

  private getRecommendations(
    factors: ConstructionSuitability['factors'],
    weather: CurrentWeather
  ): string[] {
    const recommendations: string[] = [];

    if (factors.temperature.rating === 'warning' && weather.temperature < 5) {
      recommendations.push('Warme Arbeitskleidung und Handschuhe bereitstellen');
      recommendations.push('Betonarbeiten nur mit Zusatzmitteln durchführen');
    }

    if (factors.temperature.rating === 'warning' && weather.temperature > 30) {
      recommendations.push('Ausreichend Trinkwasser bereitstellen');
      recommendations.push('Regelmäßige Pausen im Schatten einplanen');
    }

    if (factors.precipitation.rating !== 'good') {
      recommendations.push('Materialien vor Nässe schützen');
      recommendations.push('Rutschgefahr auf Gerüsten beachten');
    }

    if (factors.wind.rating !== 'good') {
      recommendations.push('Lose Materialien sichern');
      if (weather.windSpeed >= 40) {
        recommendations.push('Kranarbeiten einstellen');
      }
    }

    if (weather.uvIndex >= 6) {
      recommendations.push('Sonnenschutz und Kopfbedeckung tragen');
    }

    return recommendations;
  }

  private generateMockWeatherData(lat: number, lon: number): WeatherData {
    const now = new Date();
    const conditionCodes = [0, 1, 2, 3, 61, 63];
    const randomCode = conditionCodes[Math.floor(Math.random() * conditionCodes.length)];
    const condition = WEATHER_CONDITIONS[randomCode] || WEATHER_CONDITIONS[0];

    const current: CurrentWeather = {
      temperature: Math.round(10 + Math.random() * 15),
      feelsLike: Math.round(8 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 25),
      windDirection: Math.round(Math.random() * 360),
      pressure: Math.round(1000 + Math.random() * 30),
      visibility: Math.round(5000 + Math.random() * 15000),
      uvIndex: Math.round(Math.random() * 8),
      condition: { code: randomCode, ...condition },
      isDay: now.getHours() >= 6 && now.getHours() < 20,
      updatedAt: now,
    };

    const hourly: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now);
      time.setHours(now.getHours() + i);
      const hourCode = conditionCodes[Math.floor(Math.random() * conditionCodes.length)];
      return {
        time,
        temperature: current.temperature + Math.round((Math.random() - 0.5) * 8),
        condition: { code: hourCode, ...(WEATHER_CONDITIONS[hourCode] || WEATHER_CONDITIONS[0]) },
        precipitationProbability: Math.round(Math.random() * 50),
      };
    });

    const daily: DailyForecast[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dayCode = conditionCodes[Math.floor(Math.random() * conditionCodes.length)];
      const sunrise = new Date(date);
      sunrise.setHours(6, 30);
      const sunset = new Date(date);
      sunset.setHours(20, 0);
      return {
        date,
        minTemp: current.temperature - 5 + Math.round((Math.random() - 0.5) * 4),
        maxTemp: current.temperature + 5 + Math.round((Math.random() - 0.5) * 4),
        condition: { code: dayCode, ...(WEATHER_CONDITIONS[dayCode] || WEATHER_CONDITIONS[0]) },
        precipitationProbability: Math.round(Math.random() * 60),
        sunrise,
        sunset,
      };
    });

    return {
      location: {
        name: 'Baustelle',
        region: 'Deutschland',
        country: 'DE',
        lat,
        lon,
      },
      current,
      hourly,
      daily,
    };
  }
}

// Export singleton
export const weatherService = new WeatherService();
export default weatherService;
