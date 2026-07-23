import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      // Combine the rest of the parts in case value contains '='
      let val = parts.slice(1).join('=').trim();
      
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in .env.local');
  }

  try {
    if (!privateKey.includes('-----BEGIN')) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    privateKey = privateKey.trim();
    if (!privateKey.startsWith('-----BEGIN')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  } catch (e) {
    console.error('Error parsing private key format');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const app = initializeAdmin();
const adminAuth = admin.auth(app);
const adminDb = admin.firestore(app);

async function main() {
  const action = process.argv[2];
  
  if (!action || action === 'help') {
    console.log(`
Penggunaan:
  npx ts-node scripts/manage-admin.ts list
  npx ts-node scripts/manage-admin.ts reset <email> <password_baru>
  npx ts-node scripts/manage-admin.ts create <email> <password> <nama>
    `);
    process.exit(0);
  }

  if (action === 'list') {
    console.log('Mengambil daftar admin...');
    const adminsSnapshot = await adminDb.collection('admins').get();
    if (adminsSnapshot.empty) {
      console.log('Tidak ada admin yang terdaftar di Firestore collection "admins".');
      
      // Let's also check if there are users in Auth to make sure we aren't missing anything
      const listUsersResult = await adminAuth.listUsers();
      console.log(`\nTotal users di Firebase Auth: ${listUsersResult.users.length}`);
      listUsersResult.users.forEach(u => {
        console.log(`- Email: ${u.email}, UID: ${u.uid}, DisplayName: ${u.displayName}`);
      });
      return;
    }

    console.log(`\nDitemukan ${adminsSnapshot.size} admin di Firestore:`);
    for (const doc of adminsSnapshot.docs) {
      const data = doc.data();
      const uid = doc.id;
      try {
        const authUser = await adminAuth.getUser(uid);
        console.log(`- Email: ${authUser.email}`);
        console.log(`  UID: ${uid}`);
        console.log(`  Nama: ${authUser.displayName || data.name || 'Tidak ada nama'}`);
      } catch (err: any) {
        console.log(`- UID: ${uid} (Error mengambil data Auth: ${err.message})`);
        console.log(`  Data Firestore:`, data);
      }
    }
  } else if (action === 'reset') {
    const email = process.argv[3];
    const newPassword = process.argv[4];

    if (!email || !newPassword) {
      console.error('Error: Email dan password baru harus diisi.');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error('Error: Password minimal 6 karakter.');
      process.exit(1);
    }

    try {
      const user = await adminAuth.getUserByEmail(email);
      
      // Update password
      await adminAuth.updateUser(user.uid, {
        password: newPassword,
      });

      console.log(`\nPassword untuk admin "${email}" berhasil direset.`);
      
      // Ensure they exist in 'admins' collection
      const adminDoc = await adminDb.collection('admins').doc(user.uid).get();
      if (!adminDoc.exists) {
        console.log(`Peringatan: User ini tidak terdaftar di collection "admins" Firestore. Menambahkan...`);
        await adminDb.collection('admins').doc(user.uid).set({
          email: email,
          name: user.displayName || 'Admin',
          createdAt: new Date(),
        });
        console.log(`User ${email} sekarang sudah terdaftar sebagai admin.`);
      }
    } catch (err: any) {
      console.error(`Gagal mereset password: ${err.message}`);
    }
  } else if (action === 'create') {
    const email = process.argv[3];
    const password = process.argv[4];
    const name = process.argv[5] || 'Admin';

    if (!email || !password) {
      console.error('Error: Email dan password harus diisi.');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password minimal 6 karakter.');
      process.exit(1);
    }

    try {
      console.log(`Membuat user baru di Firebase Auth...`);
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });

      console.log(`Menambahkan user ke collection "admins" Firestore...`);
      await adminDb.collection('admins').doc(userRecord.uid).set({
        name: name,
        email: email,
        createdAt: new Date(),
      });

      console.log(`\nAdmin baru berhasil dibuat:`);
      console.log(`- Nama: ${name}`);
      console.log(`- Email: ${email}`);
      console.log(`- UID: ${userRecord.uid}`);
    } catch (err: any) {
      console.error(`Gagal membuat admin: ${err.message}`);
    }
  } else {
    console.error(`Aksi tidak dikenal: ${action}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
