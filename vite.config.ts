import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { calculateTollsWithGemini } from './server/geminiService.ts';
import { generateHealthCenters, generateGasStations, generateRouteAlerts, type RouteAlert } from './server/routeAssistantService.ts';

dotenv.config();

const reportedIncidents: RouteAlert[] = [];

function apiPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        res.setHeader('Content-Type', 'application/json');

        // Helper to parse JSON body
        const readBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        if (pathname === '/api/config' && req.method === 'GET') {
          res.end(JSON.stringify({
            googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCDrWjfx9eWyFRoAvOcVwfhyS8fkTnTDi4",
          }));
          return;
        }

        if (pathname === '/api/tolls' && req.method === 'POST') {
          try {
            const body = await readBody();
            const result = await calculateTollsWithGemini({
              origin: body.origin,
              destination: body.destination,
              distanceKm: Number(body.distanceKm) || 20,
              durationMinutes: Number(body.durationMinutes) || 25,
              vehicleType: body.vehicleType,
              dayType: body.dayType,
            });
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Error calculating tolls' }));
          }
          return;
        }

        if (pathname === '/api/health-centers' && req.method === 'GET') {
          const lat = parseFloat(url.searchParams.get('lat') || '-33.4489');
          const lng = parseFloat(url.searchParams.get('lng') || '-70.6693');
          const centers = generateHealthCenters(lat, lng);
          res.end(JSON.stringify({ centers }));
          return;
        }

        if (pathname === '/api/gas-stations' && req.method === 'GET') {
          const lat = parseFloat(url.searchParams.get('lat') || '-33.4489');
          const lng = parseFloat(url.searchParams.get('lng') || '-70.6693');
          const stations = generateGasStations(lat, lng);
          res.end(JSON.stringify({ stations }));
          return;
        }

        if (pathname === '/api/route-alerts' && req.method === 'GET') {
          const origin = url.searchParams.get('origin') || 'Santiago';
          const destination = url.searchParams.get('destination') || 'Viña del Mar';
          const alerts = [...reportedIncidents, ...generateRouteAlerts(origin, destination)];
          res.end(JSON.stringify({ alerts }));
          return;
        }

        if (pathname === '/api/report-incident' && req.method === 'POST') {
          const body = await readBody();
          const newIncident: RouteAlert = {
            id: `user-alert-${Date.now()}`,
            type: body.type || 'accidente',
            title: body.title || 'Reporte de conductor',
            description: body.description || 'Alerta reportada por usuario en ruta.',
            severity: body.severity || 'moderada',
            highwayOrStreet: body.highwayOrStreet || 'Ruta actual',
            distanceFromHereKm: 0.5,
            timestamp: 'Ahora mismo',
            verifiedByAi: true,
          };
          reportedIncidents.unshift(newIncident);
          res.end(JSON.stringify({ success: true, incident: newIncident }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
