import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskGauge } from "@/components/RiskGauge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateFuzzyRisk, FuzzyResult } from "@/utils/fuzzyEngine";
import { MALAYSIA_STATIONS, WeatherData, fetchWeatherData, WeatherStation } from "@/utils/weatherApi";
import { Radar, RefreshCw, MapPin, Wind, Droplets, Thermometer, Wifi, WifiOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom marker icons
const createMarkerIcon = (status: "Stable" | "Caution" | "Critical" | "loading") => {
  const colors = {
    Stable: "#10b981",
    Caution: "#f59e0b",
    Critical: "#f43f5e",
    loading: "#6b7280",
  };
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${colors[status]};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 15px ${colors[status]}80;
        ${status === "Critical" ? "animation: pulse 1.5s infinite;" : ""}
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map center controller
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 1 });
  }, [center, map]);
  return null;
};

const LiveSentinel = () => {
  const [selectedStation, setSelectedStation] = useState<string>("putrajaya");
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(new Map());
  const [results, setResults] = useState<Map<string, FuzzyResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);

  // Fetch data for all stations
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    
    const newWeatherData = new Map<string, WeatherData>();
    const newResults = new Map<string, FuzzyResult>();
    
    for (const station of MALAYSIA_STATIONS) {
      const data = await fetchWeatherData(station);
      newWeatherData.set(station.id, data);
      
      const result = calculateFuzzyRisk({
        wind: data.windSpeed,
        humidity: data.humidity,
        temperature: data.temperature,
      });
      newResults.set(station.id, result);
    }
    
    setWeatherData(newWeatherData);
    setResults(newResults);
    setLastSync(new Date());
    setConnected(true);
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const currentStation = MALAYSIA_STATIONS.find(s => s.id === selectedStation);
  const currentWeather = weatherData.get(selectedStation);
  const currentResult = results.get(selectedStation);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="container py-6 space-y-6 animate-fade-in-up">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Radar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold tracking-wider uppercase">
                Live Sentinel
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Real-Time Malaysia Weather Monitoring
              </p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-status-safe" />
                  <span className="text-status-safe">CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-status-critical" />
                  <span className="text-status-critical">OFFLINE</span>
                </>
              )}
            </div>
            {lastSync && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Clock className="w-4 h-4" />
                {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <GlassPanel className="p-6">
              <h3 className="text-sm text-primary font-display uppercase tracking-widest border-b border-border/50 pb-2 mb-4">
                MET Control
              </h3>
              
              {/* Station Selector */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block font-mono">
                    Active Station
                  </label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAYSIA_STATIONS.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{station.name}</span>
                            <span className="text-muted-foreground">({station.location})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                  {loading ? "Syncing..." : "Fetch Live Data"}
                </Button>
              </div>
            </GlassPanel>

            {/* Sensor Data */}
            {currentWeather && (
              <GlassPanel className="p-6">
                <h3 className="text-sm text-primary font-display uppercase tracking-widest border-b border-border/50 pb-2 mb-4">
                  Live Sensors
                </h3>
                <div className="space-y-4">
                  {/* Wind */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-primary" />
                        <span className="text-xs text-primary uppercase font-mono">Wind Speed</span>
                      </div>
                      <span className="text-sm font-mono text-foreground">
                        {currentWeather.windSpeed} km/h
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary data-bar"
                        style={{ width: `${Math.min(currentWeather.windSpeed, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Humidity */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-400 uppercase font-mono">Humidity</span>
                      </div>
                      <span className="text-sm font-mono text-foreground">
                        {currentWeather.humidity}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 data-bar"
                        style={{ width: `${currentWeather.humidity}%` }}
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-orange-400 uppercase font-mono">Temperature</span>
                      </div>
                      <span className="text-sm font-mono text-foreground">
                        {currentWeather.temperature}°C
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 data-bar"
                        style={{ width: `${(currentWeather.temperature / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Forecast */}
                <div className="mt-6 p-3 bg-background/50 rounded-lg border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">
                    Forecast
                  </p>
                  <p className="text-sm text-foreground">{currentWeather.forecast}</p>
                </div>
              </GlassPanel>
            )}

            {/* Risk Result */}
            {currentResult && (
              <GlassPanel variant="strong" className="p-6 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-mono">
                  SkySentinel Risk Analysis
                </p>
                <StatusBadge status={currentResult.status} size="lg" />
                <div className="mt-4">
                  <RiskGauge value={currentResult.dangerPercentage} size={150} />
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <GlassPanel className="p-2 h-[600px]">
              <MapContainer
                center={currentStation?.coordinates || [4.2105, 108.9758]}
                zoom={6}
                className="w-full h-full rounded-lg"
                style={{ background: "hsl(var(--background))" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {currentStation && (
                  <MapController center={currentStation.coordinates} />
                )}
                
                {MALAYSIA_STATIONS.map((station) => {
                  const result = results.get(station.id);
                  const status = result?.status || "loading";
                  
                  return (
                    <Marker
                      key={station.id}
                      position={station.coordinates}
                      icon={createMarkerIcon(status as any)}
                      eventHandlers={{
                        click: () => setSelectedStation(station.id),
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <h4 className="font-display font-bold text-primary mb-2">
                            {station.name}
                          </h4>
                          {weatherData.get(station.id) && result && (
                            <div className="space-y-2 text-xs">
                              <p>Temp: {weatherData.get(station.id)?.temperature}°C</p>
                              <p>Humidity: {weatherData.get(station.id)?.humidity}%</p>
                              <p>Wind: {weatherData.get(station.id)?.windSpeed} km/h</p>
                              <div className="pt-2 border-t border-border">
                                <p className={cn(
                                  "font-bold",
                                  result.status === "Stable" && "text-status-safe",
                                  result.status === "Caution" && "text-status-caution",
                                  result.status === "Critical" && "text-status-critical"
                                )}>
                                  Risk: {result.status} ({result.dangerPercentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSentinel;
