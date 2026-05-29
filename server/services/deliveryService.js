const DEFAULT_ALLOWED_PINCODES = ['802101'];
const PREMIUM_UNAVAILABLE_MESSAGE = "Gorus currently delivers only in Buxar (802101). We'll be expanding to your area soon.";

const normalizePincode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

const getConfiguredPincodes = () => {
  const fromEnv = String(process.env.ALLOWED_DELIVERY_PINCODES || '')
    .split(',')
    .map(normalizePincode)
    .filter(pin => pin.length === 6);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_PINCODES;
};

const extractPincode = (value) => {
  const match = String(value || '').match(/\b\d{6}\b/);
  return match ? match[0] : '';
};

async function ensureDeliveryTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS delivery_pincodes (
      id SERIAL PRIMARY KEY,
      pincode VARCHAR(6) UNIQUE NOT NULL,
      city TEXT NOT NULL,
      state TEXT DEFAULT 'Bihar',
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS unsupported_delivery_requests (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      pincode VARCHAR(6) NOT NULL,
      source TEXT DEFAULT 'website',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_delivery_pincodes_active ON delivery_pincodes(active);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_unsupported_delivery_requests_pincode ON unsupported_delivery_requests(pincode);');

  for (const pincode of getConfiguredPincodes()) {
    await pool.query(`
      INSERT INTO delivery_pincodes (pincode, city, state, active)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (pincode)
      DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state, active = 1
    `, [pincode, pincode === '802101' ? 'Buxar' : 'Service Area', 'Bihar']);
  }
}

async function getAllowedPincodes(pool) {
  await ensureDeliveryTables(pool);
  const { rows } = await pool.query(`
    SELECT pincode, city, state
    FROM delivery_pincodes
    WHERE active = 1
    ORDER BY pincode ASC
  `);
  return rows;
}

async function validateDeliveryArea(pool, { pincode, address } = {}) {
  const normalized = normalizePincode(pincode) || extractPincode(address);
  const allowedPincodes = await getAllowedPincodes(pool);
  const match = allowedPincodes.find(row => row.pincode === normalized);

  if (!normalized || normalized.length !== 6) {
    return {
      allowed: false,
      pincode: normalized,
      message: 'Please enter a valid 6-digit delivery pincode.'
    };
  }

  if (!match) {
    return {
      allowed: false,
      pincode: normalized,
      message: PREMIUM_UNAVAILABLE_MESSAGE
    };
  }

  return {
    allowed: true,
    pincode: normalized,
    city: match.city,
    state: match.state,
    message: `Delivery available in ${match.city} (${match.pincode}).`
  };
}

async function recordUnsupportedRequest(pool, { name, email, phone, pincode, source = 'website' }) {
  await ensureDeliveryTables(pool);
  const normalized = normalizePincode(pincode);

  if (!normalized || normalized.length !== 6) {
    const error = new Error('Please enter a valid 6-digit pincode.');
    error.statusCode = 400;
    throw error;
  }

  const availability = await validateDeliveryArea(pool, { pincode: normalized });
  if (availability.allowed) {
    return { alreadyAvailable: true, request: null, availability };
  }

  const { rows } = await pool.query(`
    INSERT INTO unsupported_delivery_requests (name, email, phone, pincode, source)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name || null, email || null, phone || null, normalized, source]);

  return { alreadyAvailable: false, request: rows[0], availability };
}

module.exports = {
  DEFAULT_ALLOWED_PINCODES,
  PREMIUM_UNAVAILABLE_MESSAGE,
  ensureDeliveryTables,
  extractPincode,
  getAllowedPincodes,
  normalizePincode,
  recordUnsupportedRequest,
  validateDeliveryArea
};
