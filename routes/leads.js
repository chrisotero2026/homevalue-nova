const express      = require('express');
const pool         = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Valid ZIP codes for Northern Virginia service area
const VALID_ZIPS = ['22554', '22191', '22192', '22193', '22401', '22405', '22406'];

// Valid lead status values
const VALID_STATUSES = ['New', 'Contacted', 'Appointment', 'Closed'];

/**
 * Send an SMS notification to the correct agent phone number based on lead language.
 * - lang === 'es'  → AGENT_PHONE_SPANISH
 * - lang === 'en' (or anything else) → AGENT_PHONE_ENGLISH
 * Falls back to AGENT_PHONE_NUMBER if the language-specific variable is not set.
 * Gracefully logs errors without crashing the request.
 */
async function sendAgentSMS(lead) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    AGENT_PHONE_ENGLISH,
    AGENT_PHONE_SPANISH,
    AGENT_PHONE_NUMBER,  // legacy fallback
    DASHBOARD_URL,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio environment variables not fully configured — SMS skipped.');
    return;
  }

  // Determine recipient based on the language the lead submitted in
  const isSpanish = (lead.lang || '').toLowerCase() === 'es';
  const toNumber = isSpanish
    ? (AGENT_PHONE_SPANISH || AGENT_PHONE_NUMBER)
    : (AGENT_PHONE_ENGLISH || AGENT_PHONE_NUMBER);

  if (!toNumber) {
    console.warn('No agent phone number configured — SMS skipped.');
    return;
  }

  try {
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Determine score emoji
    let scoreEmoji;
    if (lead.score >= 71)      scoreEmoji = '🔥';
    else if (lead.score >= 41) scoreEmoji = '⚡';
    else                       scoreEmoji = '📋';

    const body = [
      `🏠 New Seller Lead`,
      `Name: ${lead.name}`,
      `Score: ${lead.score} ${scoreEmoji}`,
      `Location: ${lead.city}, ${lead.zip_code}`,
      `Phone: ${lead.phone}`,
      `Lang: ${isSpanish ? 'ES 🇪🇸' : 'EN 🇺🇸'}`,
      `Dashboard: ${DASHBOARD_URL || 'N/A'}`,
    ].join('\n');

    await twilio.messages.create({
      body,
      from: TWILIO_FROM_NUMBER,
      to:   toNumber,
    });

    console.log(`SMS sent to ${isSpanish ? 'Spanish' : 'English'} agent (${toNumber}) for lead: ${lead.name}`);
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
  }
}

/**
 * POST /api/leads
 * No auth required.
 * Body: { name, phone, email, address, city, zip_code, value_low, value_high, q1, q2, q3, q4, score, lang }
 * lang: 'en' | 'es'  — determines which agent phone receives the SMS
 */
router.post('/', async (req, res) => {
  const {
    name, phone, email, address, city, zip_code,
    value_low, value_high, q1, q2, q3, q4, score,
    lang,  // 'en' or 'es'
  } = req.body;

  // Required field validation
  if (!name || !phone || !address || !city || !zip_code || score === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  // ZIP code validation
  const zip = String(zip_code).trim();
  if (!VALID_ZIPS.includes(zip)) {
    return res.status(400).json({ success: false, error: 'ZIP code is not in the service area.' });
  }

  // Normalise language flag
  const language = (lang || 'en').toLowerCase() === 'es' ? 'es' : 'en';

  try {
    const result = await pool.query(
      `INSERT INTO leads
         (name, phone, email, address, city, zip_code, value_low, value_high, q1, q2, q3, q4, score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, score`,
      [
        name.trim(),
        phone.trim(),
        email ? email.trim() : null,
        address.trim(),
        city.trim(),
        zip,
        value_low  || null,
        value_high || null,
        q1 || null,
        q2 || null,
        q3 || null,
        q4 || null,
        Number(score),
      ]
    );

    const savedLead = result.rows[0];

    // Fire-and-forget SMS — pass language so the correct agent number is used
    sendAgentSMS({ name, phone, city, zip_code: zip, score: Number(score), lang: language });

    return res.status(201).json({ success: true, id: savedLead.id, score: savedLead.score });
  } catch (err) {
    console.error('POST /api/leads error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * GET /api/leads
 * Requires valid JWT.
 * Returns all leads ordered by score descending.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id, name, phone, email, address, city, zip_code,
         value_low, value_high, q1, q2, q3, q4, score, status,
         TO_CHAR(created_at, 'YYYY-MM-DD') AS date
       FROM leads
       ORDER BY score DESC, created_at DESC`
    );

    return res.json({ success: true, leads: result.rows });
  } catch (err) {
    console.error('GET /api/leads error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * PUT /api/leads/:id
 * Requires valid JWT.
 * Body: { status }  — must be one of New | Contacted | Appointment | Closed
 */
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  try {
    const result = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    return res.json({ success: true, id: result.rows[0].id, status: result.rows[0].status });
  } catch (err) {
    console.error('PUT /api/leads/:id error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
