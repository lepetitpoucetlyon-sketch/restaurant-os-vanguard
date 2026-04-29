import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';

import { listLoginProfiles, loginWithPin } from './modules/auth';
import { askGeminiAgent } from './modules/oracle';

admin.initializeApp();

// --- 🏛️ EXPORTS (Grade X+++) ---

// Auth
export { listLoginProfiles, loginWithPin };

// Intelligence
export { askGeminiAgent };

// Accounting (Legacy Mirror)
export { onJournalEntryCreated } from './bigquery/accounting-mirror';
