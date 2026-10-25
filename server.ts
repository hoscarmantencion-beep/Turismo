import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { calculateTollsWithGemini } from './server/geminiService.ts';
import { generateHealthCenters, generateGasStations, generateRouteAlerts, RouteAlert } from './server/routeAssistantService.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory user reports store
const reportedIncidents: RouteAlert[] = [];

// API: Config
app.get('/api/config', (_req, res) => {
  res.json({
    googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCDrWjfx9eWyFRoAvOcVwfhyS8fkTnTDi4",
  });
});

// API: Tolls & TAG calculation with Gemini AI
app.post('/api/tolls', async (req, res) => {
  try {
    const { origin, destination, distanceKm, durationMinutes, vehicleType, dayType } = req.body;
    if (!origin || !destination) {
      res.status(400).json({ error: 'Origin and destination are required' });
      return;
    }
    const result = await calculateTollsWithGemini({
      origin,
      destination,
      distanceKm: Number(distanceKm) || 20,
      durationMinutes: Number(durationMinutes) || 25,
      vehicleType,
      dayType,
    });
    res.json(result);
  } catch (err: any) {
    console.error('API /api/tolls error:', err);
    res.status(500).json({ error: err.message || 'Internal error calculating tolls' });
  }
});

// API: Nearby Health Public Centers (CESFAM, Postas, Hospitales)
app.get('/api/health-centers', (req, res) => {
  const lat = parseFloat(req.query.lat as string) || -33.4489;
  const lng = parseFloat(req.query.lng as string) || -70.6693;
  const centers = generateHealthCenters(lat, lng);
  res.json({ centers });
});

// API: Nearby Gas Stations
app.get('/api/gas-stations', (req, res) => {
  const lat = parseFloat(req.query.lat as string) || -33.4489;
  const lng = parseFloat(req.query.lng as string) || -70.6693;
  const stations = generateGasStations(lat, lng);
  res.json({ stations });
});

// API: Route Alerts and Incidents
app.get('/api/route-alerts', (req, res) => {
  const origin = (req.query.origin as string) || 'Santiago';
  const destination = (req.query.destination as string) || 'Viña del Mar';
  const alerts = [...reportedIncidents, ...generateRouteAlerts(origin, destination)];
  res.json({ alerts });
});

// API: Report incident
app.post('/api/report-incident', (req, res) => {
  const { type, title, description, highwayOrStreet, severity } = req.body;
  if (!type || !title) {
    res.status(400).json({ error: 'Type and title are required' });
    return;
  }
  const newIncident: RouteAlert = {
    id: `user-alert-${Date.now()}`,
    type: type || 'accidente',
    title: title || 'Reporte de conductor',
    description: description || 'Alerta reportada por usuario en ruta.',
    severity: severity || 'moderada',
    highwayOrStreet: highwayOrStreet || 'Ruta actual',
    distanceFromHereKm: 0.5,
    timestamp: 'Ahora mismo',
    verifiedByAi: true,
  };
  reportedIncidents.unshift(newIncident);
  res.json({ success: true, incident: newIncident });
});

// Serve static assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
