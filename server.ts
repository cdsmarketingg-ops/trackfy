import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import * as admin from "firebase-admin";
import axios from "axios";
import crypto from "crypto";

console.log("Starting server initialization...");

// Initialize Firebase Admin
// In Cloud Run, it will automatically use the default service account
try {
  if (admin.apps.length === 0) {
    console.log("Initializing Firebase Admin with project ID:", process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0020267451");
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0020267451" // Fallback to provided ID
    });
    console.log("Firebase Admin initialized successfully.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

const db = admin.firestore();
console.log("Firestore instance created.");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Helper to hash PII for Meta CAPI
const hashData = (data: string) => {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

// Settings cache
let cachedSettings: any = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute

const getSettings = async () => {
  const now = Date.now();
  if (cachedSettings && (now - lastSettingsFetch < SETTINGS_CACHE_TTL)) {
    return cachedSettings;
  }

  const settingsDoc = await db.collection("settings").doc("config").get();
  if (settingsDoc.exists) {
    cachedSettings = settingsDoc.data();
    lastSettingsFetch = now;
    return cachedSettings;
  }

  return {
    meta_pixel_id: process.env.META_PIXEL_ID,
    meta_access_token: process.env.META_ACCESS_TOKEN,
    webhook_secret: process.env.WEBHOOK_SECRET
  };
};

// Meta CAPI Helper
const sendMetaEvent = async (eventName: string, userData: any, customData: any = {}) => {
  const settings = await getSettings();
  const pixelId = settings.meta_pixel_id;
  const accessToken = settings.meta_access_token;

  if (!pixelId || !accessToken) {
    console.warn("Meta Pixel ID or Access Token missing. Skipping CAPI event.");
    return;
  }

  try {
    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          client_ip_address: userData.ip,
          client_user_agent: userData.user_agent,
          em: userData.email ? [hashData(userData.email)] : [],
          fbc: userData.fbc || null,
          fbp: userData.fbp || null,
        },
        custom_data: customData,
        event_id: uuidv4(),
      }]
    };

    await axios.post(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, payload);
    console.log(`Meta CAPI event ${eventName} sent successfully.`);
  } catch (error) {
    console.error("Error sending Meta CAPI event:", error);
  }
};

// 1. CAPTURA DE UTMs & SESSION
app.get("/init-session", async (req, res) => {
  const utms = {
    utm_source: req.query.utm_source as string || null,
    utm_campaign: req.query.utm_campaign as string || null,
    utm_medium: req.query.utm_medium as string || null,
    utm_content: req.query.utm_content as string || null,
    utm_term: req.query.utm_term as string || null,
  };

  let sessionId = req.cookies.utmify_session;

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("utmify_session", sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    // Create session in Firestore
    await db.collection("sessions").doc(sessionId).set({
      id: sessionId,
      ...utms,
      ip: req.ip,
      user_agent: req.headers["user-agent"],
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    });
  } else {
    // Update last active
    await db.collection("sessions").doc(sessionId).update({
      last_active: new Date().toISOString()
    });
  }

  res.json({ sessionId });
});

// 4. ENDPOINT DE EVENTOS
app.post("/api/track", async (req, res) => {
  const { event_name, session_id, url, user_data } = req.body;
  const sessionId = session_id || req.cookies.utmify_session;

  if (!sessionId) {
    return res.status(400).json({ error: "No session ID" });
  }

  const eventId = uuidv4();
  const eventData = {
    id: eventId,
    session_id: sessionId,
    event_name,
    url,
    timestamp: new Date().toISOString()
  };

  await db.collection("events").doc(eventId).set(eventData);

  // Meta CAPI for certain events
  if (["ViewContent", "InitiateCheckout"].includes(event_name)) {
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    const session = sessionDoc.data();
    if (session) {
      sendMetaEvent(event_name, {
        ip: req.ip,
        user_agent: req.headers["user-agent"],
        email: session.email
      });
    }
  }

  res.json({ success: true, eventId });
});

// 5. INTEGRAÇÃO COM PLATAFORMA (WEBHOOK)
app.post("/webhook/purchase", async (req, res) => {
  const { value, currency, status, email, products, session_id } = req.body;
  
  // Validate webhook token
  const settings = await getSettings();
  const webhookToken = req.headers["x-utmify-token"];
  if (settings.webhook_secret && webhookToken !== settings.webhook_secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let sessionId = session_id;

  // If no session_id provided, try to find by email (Last Click Attribution)
  if (!sessionId && email) {
    const sessionsSnapshot = await db.collection("sessions")
      .where("email", "==", email)
      .orderBy("created_at", "desc")
      .limit(1)
      .get();
    
    if (!sessionsSnapshot.empty) {
      sessionId = sessionsSnapshot.docs[0].id;
    }
  }

  if (!sessionId) {
    console.warn("Could not find session for purchase:", email);
    return res.status(400).json({ error: "No session found" });
  }

  const sessionDoc = await db.collection("sessions").doc(sessionId).get();
  const sessionData = sessionDoc.data();

  const purchaseId = uuidv4();
  const purchaseData = {
    id: purchaseId,
    session_id: sessionId,
    value: parseFloat(value),
    currency: currency || "BRL",
    status: status || "approved",
    email,
    products: products || [],
    created_at: new Date().toISOString(),
    utm_campaign: sessionData?.utm_campaign || "organic",
    utm_source: sessionData?.utm_source || "direct"
  };

  await db.collection("purchases").doc(purchaseId).set(purchaseData);

  // Meta CAPI Purchase
  if (status === "approved" || !status) {
    sendMetaEvent("Purchase", {
      ip: sessionData?.ip || req.ip,
      user_agent: sessionData?.user_agent || req.headers["user-agent"],
      email: email
    }, {
      value: parseFloat(value),
      currency: currency || "BRL"
    });
  }

  res.json({ success: true, purchaseId });
});

// 7. DASHBOARD DATA
app.get("/api/stats", async (req, res) => {
  const purchasesSnapshot = await db.collection("purchases").get();
  const sessionsSnapshot = await db.collection("sessions").get();

  const purchases = purchasesSnapshot.docs.map(doc => doc.data());
  const sessions = sessionsSnapshot.docs.map(doc => doc.data());

  // Aggregate by campaign
  const campaignStats: any = {};
  purchases.forEach((p: any) => {
    const campaign = p.utm_campaign || "unknown";
    if (!campaignStats[campaign]) {
      campaignStats[campaign] = { campaign, revenue: 0, sales: 0, cost: 0 };
    }
    campaignStats[campaign].revenue += p.value;
    campaignStats[campaign].sales += 1;
  });

  res.json({
    totalRevenue: purchases.reduce((acc: number, p: any) => acc + p.value, 0),
    totalSales: purchases.length,
    totalSessions: sessions.length,
    campaignStats: Object.values(campaignStats)
  });
});

async function startServer() {
  console.log("Starting startServer function...");
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Creating Vite server for development...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } catch (error) {
      console.error("Error creating Vite server:", error);
    }
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
