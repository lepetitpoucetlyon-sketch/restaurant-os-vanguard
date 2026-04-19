import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import ws from 'ws';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

const PORT = 3001;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY manquant dans .env.local");
    process.exit(1);
}

const app = new Hono();

/**
 * 🛰️ NEXUS LIVE RELAY (Industrial Grade)
 * This server bridges the frontend PCM stream to the Google Multimodal Live API.
 */
const server = serve({
    fetch: app.fetch,
    port: PORT
}, (info) => {
    console.log(`📡 Relais Nexus Oracle actif sur http://localhost:${info.port}`);
});

// Since @hono/node-server returns a standard Node server or similar, 
// we attach the WebSocket server to it.
const wss = new (ws.WebSocketServer || (ws as any).Server)({ server: server as any, path: '/api/gemini-live/ws' });

wss.on('connection', (socket) => {
    console.log("🟢 Client connecté au Relais Nexus...");

    const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.MultimodalLive?key=${API_KEY}`;
    const geminiWs = new ws.WebSocket(GEMINI_WS_URL);

    // Proxy Frontend -> Gemini
    socket.on('message', (message, isBinary) => {
        if (geminiWs.readyState === ws.WebSocket.OPEN) {
            geminiWs.send(message, { binary: isBinary });
        }
    });

    // Proxy Gemini -> Frontend
    geminiWs.on('open', () => {
        console.log("✨ Connecté à l'API Gemini Multimodal Live.");
    });

    geminiWs.on('message', (message, isBinary) => {
        if (socket.readyState === ws.WebSocket.OPEN) {
            socket.send(message, { binary: isBinary });
        }
    });

    geminiWs.on('error', (err) => {
        console.error("❌ Gemini API Error:", err.message);
        socket.send(JSON.stringify({ type: 'error', message: "Gemini API Connection Error" }));
    });

    geminiWs.on('close', () => {
        console.log("🔴 Connexion Gemini fermée.");
        socket.close();
    });

    socket.on('close', () => {
        console.log("🔴 Client déconnecté.");
        geminiWs.close();
    });

    socket.on('error', (err) => {
        console.error("❌ WebSocket Client Error:", err.message);
        geminiWs.close();
    });
});
