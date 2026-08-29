import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { MediaAsset } from '../models/MediaAsset';
import { r2Client } from '../config/r2';
import { env } from '../config/env';
import { R2Service } from '../services/r2.service';
import os from 'os';

// Configure fluent-ffmpeg to use the locally installed static binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
  console.error("❌ ffmpeg-static not found");
  process.exit(1);
}

// Load .env.local or .env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: '.env.local', override: true });
} else {
  require('dotenv').config();
}

const MONGODB_URI = process.env.MONGODB_URI!;

async function extractFrame(videoUrl: string, outputFilename: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .on('end', () => resolve(path.join(outputPath, outputFilename)))
      .on('error', (err) => reject(err))
      .screenshots({
        count: 1,
        timestamps: ['00:00:01.000'], // 1-second mark
        filename: outputFilename,
        folder: outputPath,
        size: '?x720', // Scale proportionally to 720p height
      });
  });
}

async function uploadThumbnailToR2(filePath: string, r2Key: string) {
  const fileStream = fs.createReadStream(filePath);
  const uploadParams = {
    Bucket: env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileStream,
    ContentType: 'image/jpeg',
  };
  await r2Client.send(new PutObjectCommand(uploadParams));
}

async function generateThumbnails() {
  console.log('==================================================');
  console.log('🖼️  Starting Thumbnail Generation & Upload');
  console.log('==================================================\n');

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to: ${mongoose.connection.name}\n`);

  const tmpDir = os.tmpdir();

  // Find all videos that don't have a thumbnail
  const videos = await MediaAsset.find({ type: 'video', thumbnailR2Key: { $exists: false } });
  console.log(`Found ${videos.length} videos missing thumbnails.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const video of videos) {
    console.log(`Processing: ${video.title}`);
    
    if (!video.r2Key) {
      console.log(`   ⏭️ Skipped: No r2Key in database for this video.`);
      continue;
    }

    try {
      // 1. Get pre-signed URL for the video so FFmpeg can stream it
      const streamUrl = await R2Service.generatePresignedGetUrl(video.r2Key, 3600);

      // 2. Extract frame
      const thumbnailFilename = `${video.slug}-thumb.jpg`;
      console.log(`   - Extracting frame...`);
      const localFilePath = await extractFrame(streamUrl, thumbnailFilename, tmpDir);

      // 3. Upload to R2
      const thumbnailR2Key = `videos/thumbnails/${thumbnailFilename}`;
      console.log(`   - Uploading to R2: ${thumbnailR2Key}`);
      await uploadThumbnailToR2(localFilePath, thumbnailR2Key);

      // 4. Update MongoDB
      video.thumbnailR2Key = thumbnailR2Key;
      await video.save();

      // 5. Cleanup local file
      fs.unlinkSync(localFilePath);
      console.log(`   ✅ Success`);
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n==================================================');
  console.log(`🎉 Done! Success: ${successCount} | Errors: ${errorCount}`);
  console.log('==================================================\n');

  await mongoose.disconnect();
}

generateThumbnails().catch(console.error);
