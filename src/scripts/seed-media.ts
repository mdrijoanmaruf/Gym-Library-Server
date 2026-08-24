/**
 * seed-media.ts
 * One-time (idempotent) script to scan the GYM/ directory and populate
 * MongoDB with MediaAsset metadata records.
 *
 * Run: npx ts-node src/scripts/seed-media.ts
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MediaAsset } from '../models/MediaAsset';

// Load .env.local or .env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: '.env.local', override: true });
} else {
  require('dotenv').config();
}

const MONGODB_URI = process.env.MONGODB_URI!;
const GYM_DIR = path.resolve(process.cwd(), 'GYM');

// Categories to include (skip "Uncertain")
const VALID_CATEGORIES = ['Abs', 'Arms', 'Back', 'Chest', 'Legs', 'Shoulders'];

function cleanTitle(filename: string): string {
  // Remove extension, clean up common abbreviations
  return filename
    .replace(/\.(gif|mp4|png|jpg|jpeg)$/i, '')
    .trim();
}

async function seed() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to: ${mongoose.connection.name}`);

  let seeded = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const category of VALID_CATEGORIES) {
    const categoryDir = path.join(GYM_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      console.warn(`⚠️  Directory not found: ${categoryDir}`);
      continue;
    }

    // Process GIFs
    const gifDir = path.join(categoryDir, 'GIF');
    if (fs.existsSync(gifDir)) {
      const files = fs.readdirSync(gifDir).filter((f) =>
        /\.(gif|png|jpg|jpeg)$/i.test(f)
      );
      for (const filename of files) {
        const relPath = path.join('GYM', category, 'GIF', filename).replace(/\\/g, '/');
        try {
          const existing = await MediaAsset.findOne({ filePath: relPath });
          if (existing) { skipped++; continue; }

          await MediaAsset.create({
            category,
            type: 'gif',
            title: cleanTitle(filename),
            filename,
            filePath: relPath,
          });
          seeded++;
        } catch (err: any) {
          errors.push(`GIF ${relPath}: ${err.message}`);
        }
      }
    }

    // Process Videos
    const videoDir = path.join(categoryDir, 'Video');
    if (fs.existsSync(videoDir)) {
      const files = fs.readdirSync(videoDir).filter((f) => /\.mp4$/i.test(f));
      for (const filename of files) {
        const relPath = path.join('GYM', category, 'Video', filename).replace(/\\/g, '/');
        try {
          const existing = await MediaAsset.findOne({ filePath: relPath });
          if (existing) { skipped++; continue; }

          await MediaAsset.create({
            category,
            type: 'video',
            title: cleanTitle(filename),
            filename,
            filePath: relPath,
          });
          seeded++;
        } catch (err: any) {
          errors.push(`Video ${relPath}: ${err.message}`);
        }
      }
    }

    console.log(`  📁 ${category} — processed`);
  }

  console.log(`\n✅ Seeded: ${seeded} | Skipped (already exist): ${skipped}`);
  if (errors.length > 0) {
    console.error(`\n❌ Errors (${errors.length}):`);
    errors.forEach((e) => console.error('  ', e));
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
