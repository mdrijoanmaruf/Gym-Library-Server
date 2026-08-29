import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { MediaAsset } from '../models/MediaAsset';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

// Load .env.local or .env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: '.env.local', override: true });
} else {
  require('dotenv').config();
}

const MONGODB_URI = process.env.MONGODB_URI!;
const GYM_DIR = path.resolve(process.cwd(), 'GYM');
const VALID_CATEGORIES = ['Abs', 'Arms', 'Back', 'Chest', 'Legs', 'Shoulders'];

function cleanTitle(filename: string): string {
  // Remove extension, replace dashes/underscores with spaces
  return filename
    .replace(/\.(gif|mp4|png|jpg|jpeg)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

async function uploadFileToR2(filePath: string, r2Key: string, contentType: string) {
  const fileStream = fs.createReadStream(filePath);
  const uploadParams = {
    Bucket: env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileStream,
    ContentType: contentType,
  };
  await r2Client.send(new PutObjectCommand(uploadParams));
}

async function seedAndUpload() {
  console.log('==================================================');
  console.log('🚀 Starting Unified R2 Upload & MongoDB Seeding...');
  console.log('==================================================\n');

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

  try {
    console.log('🗑️  Dropping old filePath index (if exists)...');
    await MediaAsset.collection.dropIndex('filePath_1');
  } catch (err: any) {
    // Ignore error if index doesn't exist
  }

  if (!fs.existsSync(GYM_DIR)) {
    console.error(`❌ GYM directory not found at: ${GYM_DIR}`);
    process.exit(1);
  }

  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Iterate over each category folder
  for (const category of VALID_CATEGORIES) {
    const categoryPath = path.join(GYM_DIR, category);
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️ Skipping missing category folder: ${category}`);
      continue;
    }

    console.log(`\n📂 Scanning Category: [${category}]`);
    
    // We need to check the 'Video' and 'GIF' subdirectories
    const subDirs = ['Video', 'GIF'];
    for (const sub of subDirs) {
      const subPath = path.join(categoryPath, sub);
      if (!fs.existsSync(subPath)) continue;

      const files = fs.readdirSync(subPath);

      for (const file of files) {
        const filePath = path.join(subPath, file);
        
        // Only process files, skip directories if any
        if (fs.statSync(filePath).isDirectory()) continue;
        
        // Determine type and content type
        const isVideo = file.toLowerCase().endsWith('.mp4');
        const isGif = file.toLowerCase().endsWith('.gif');

        if (!isVideo && !isGif) {
          console.log(`   ⏭️  Skipping unsupported file format: ${file}`);
          continue;
        }

        const type = isVideo ? 'video' : 'gif';
        const typeFolder = isVideo ? 'videos' : 'gifs';
        const contentType = isVideo ? 'video/mp4' : 'image/gif';
        const title = cleanTitle(file);
        const r2Key = `${typeFolder}/${category.toLowerCase()}/${file}`;

        console.log(`\n   -----------------------------------------`);
        console.log(`   📄 File: ${file}`);
        console.log(`   📝 Title: "${title}"`);
        console.log(`   ☁️  R2 Key: ${r2Key}`);

        try {
          // 1. Check if it already exists in the database
          const existingAsset = await MediaAsset.findOne({ r2Key });
          if (existingAsset) {
            console.log(`   ✅ ALREADY IN DB: Skipping upload for this file.`);
            totalSkipped++;
            continue;
          }

          // 2. Upload to Cloudflare R2
          console.log(`   ⬆️  Uploading to Cloudflare R2...`);
          await uploadFileToR2(filePath, r2Key, contentType);
          console.log(`   ✅ Upload successful!`);

          // 3. Save to MongoDB
          console.log(`   💾 Saving record to MongoDB...`);
          await MediaAsset.create({
            title: title,
            category: category,
            type: type,
            r2Key: r2Key,
            difficulty: 'beginner',
            equipment: [],
            muscleGroups: [category.toLowerCase()],
            tags: [],
            isPublished: true,
            viewCount: 0
          });
          console.log(`   ✅ Saved to database!`);

          totalUploaded++;
        } catch (error: any) {
          console.error(`   ❌ ERROR processing ${file}:`, error.message);
          totalErrors++;
        }
      }
    }
  }

  console.log('\n==================================================');
  console.log('🎉 SCRIPT COMPLETE');
  console.log(`📈 Summary:`);
  console.log(`   - Successfully Uploaded & Saved: ${totalUploaded}`);
  console.log(`   - Skipped (Already existed): ${totalSkipped}`);
  console.log(`   - Errors Encountered: ${totalErrors}`);
  console.log('==================================================\n');

  await mongoose.disconnect();
}

seedAndUpload().catch(console.error);
