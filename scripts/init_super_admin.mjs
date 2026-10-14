import { MongoClient } from 'mongodb';
import crypto from 'node:crypto';
import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const pbkdf2 = util.promisify(crypto.pbkdf2);
const PBKDF2_ITERATIONS = 210000;

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex'), iterations = PBKDF2_ITERATIONS) {
  const hash = (await pbkdf2(password, salt, iterations, 32, 'sha256')).toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const [, iterations, salt] = parts;
  const candidate = await hashPassword(password, salt, Number(iterations));
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

// Read URI from .env.local if present
let uri = 'mongodb+srv://krisprogrammer1_db_user:v2KQr3MOS8S5LvqJ@cluster0.plfe9qb.mongodb.net/?retryWrites=true&w=majority';
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*MONGODB_URI\s*=\s*['"]?(.*?)['"]?\s*$/);
    if (match && match[1]) {
      uri = match[1];
      break;
    }
  }
} catch (e) {}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('syneolab');
    
    const strongPassword = 'Syneo#2026$Secure!Admin99';
    const hashedPassword = await hashPassword(strongPassword);

    // Verify hash integrity immediately
    const valid = await verifyPassword(strongPassword, hashedPassword);
    if (!valid) throw new Error('Password hash self-test failed');

    const emailsToConfigure = ['syneolabs@gmail.com', 'syneolab@gmail.com'];

    for (const email of emailsToConfigure) {
      const existing = await db.collection('users').findOne({ email });
      if (existing) {
        await db.collection('users').updateOne(
          { _id: existing._id },
          {
            $set: {
              role: 'super_admin',
              password: hashedPassword,
              status: 'active',
              department: 'Management',
              position: 'Founder, CEO',
              positions: ['Founder', 'CEO']
            }
          }
        );
        console.log(`Updated existing ${email} account as super_admin`);
      } else {
        const doc = {
          _id: crypto.randomBytes(12).toString('hex'),
          name: 'Syneolab Super Admin',
          email,
          password: hashedPassword,
          role: 'super_admin',
          department: 'Management',
          position: 'Founder, CEO',
          positions: ['Founder', 'CEO'],
          status: 'active',
          created: new Date().toISOString()
        };
        await db.collection('users').insertOne(doc);
        console.log(`Created new ${email} account as super_admin`);
      }
    }

    // Clear login throttling records to prevent lockouts
    await db.collection('login_attempts').deleteMany({});
    console.log('Cleared all login throttle records');

    // Remove old sessions for clean start
    await db.collection('sessions').deleteMany({});
    console.log('Cleared old sessions');

    console.log('\n--- SUPER ADMIN PROVISIONED SUCCESSFULLY ---');
    console.log('Primary Email:   syneolabs@gmail.com');
    console.log('Fallback Email:  syneolab@gmail.com');
    console.log('Strong Password: ' + strongPassword);
    console.log('Role:            super_admin');
    console.log('Status:          active');
  } catch (err) {
    console.error('Initialization error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
