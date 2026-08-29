import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MediaAsset } from '../models/MediaAsset';
import { R2Service } from '../services/r2.service';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: '.env.local', override: true });
} else {
  require('dotenv').config();
}

const MONGODB_URI = process.env.MONGODB_URI!;

function cleanTitle(filename: string): string {
  const base = path.basename(filename);
  return base
    .replace(/\.(gif|mp4|png|jpg|jpeg)$/i, '')
    .trim();
}

async function seed() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to: ${mongoose.connection.name}`);

  // Fetch all objects from R2 (prefix videos/ and gifs/)
  const videoKeys = await R2Service.listObjects('videos/');
  const gifKeys = await R2Service.listObjects('gifs/');
  
  const allKeys = [...videoKeys, ...gifKeys];
  console.log(`Found ${allKeys.length} objects in R2...`);

  let added = 0;
  let skipped = 0;

  for (const r2Key of allKeys) {
    if (r2Key.endsWith('/')) continue; // Skip directory markers

    const existing = await MediaAsset.findOne({ r2Key });
    if (existing) {
      skipped++;
      continue;
    }

    // Determine type and category from path structure e.g., "videos/abs/crunch.mp4"
    const parts = r2Key.split('/');
    if (parts.length < 3) continue;

    const typeDir = parts[0]; // videos | gifs
    const categoryDir = parts[1]; // abs | arms | legs
    const filename = parts[parts.length - 1];

    const type = typeDir === 'videos' ? 'video' : 'gif';
    // Capitalize category
    const category = categoryDir.charAt(0).toUpperCase() + categoryDir.slice(1);
    const title = cleanTitle(filename);

    await MediaAsset.create({
      title,
      category,
      type,
      r2Key,
      difficulty: 'beginner',
      equipment: [],
      muscleGroups: [category.toLowerCase()],
      tags: [],
      isPublished: true,
      viewCount: 0
    });

    added++;
  }

  console.log(`\n✅ Seed Complete. Added: ${added}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(console.error);
