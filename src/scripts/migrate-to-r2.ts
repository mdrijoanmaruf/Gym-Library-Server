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

async function migrate() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to: ${mongoose.connection.name}`);

  // Need to bypass strict schema slightly to read the old filePath
  const assets = await MediaAsset.collection.find({ filePath: { $exists: true } }).toArray();
  console.log(`Found ${assets.length} old assets to migrate...`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const asset of assets) {
    if (!asset.filePath) continue;

    const absPath = path.resolve(process.cwd(), asset.filePath);
    
    // Create new r2Key: "videos/abs/filename.mp4" or "gifs/abs/filename.gif"
    const typeFolder = asset.type === 'video' ? 'videos' : 'gifs';
    const categoryFolder = (asset.category || 'unknown').toLowerCase();
    const r2Key = `${typeFolder}/${categoryFolder}/${asset.filename}`;

    try {
      if (!fs.existsSync(absPath)) {
        console.warn(`⚠️ File not found on disk: ${absPath}`);
        continue;
      }

      console.log(`Uploading ${asset.filename} to R2 as ${r2Key}...`);
      
      const fileStream = fs.createReadStream(absPath);
      const contentType = asset.type === 'video' ? 'video/mp4' : 'image/gif';

      const uploadParams = {
        Bucket: env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileStream,
        ContentType: contentType,
      };

      await r2Client.send(new PutObjectCommand(uploadParams));

      // Update DB record
      await MediaAsset.collection.updateOne(
        { _id: asset._id },
        { 
          $set: { 
            r2Key, 
            difficulty: 'beginner',
            equipment: [],
            muscleGroups: asset.category ? [asset.category.toLowerCase()] : [],
            tags: [],
            isPublished: true,
            viewCount: 0
          },
          $unset: { filePath: "", filename: "" }
        }
      );

      migrated++;
    } catch (err: any) {
      console.error(`❌ Error migrating ${asset.filename}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅ Migration Complete. Migrated: ${migrated}, Errors: ${errors}`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
