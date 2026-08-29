import fs from 'fs';
import path from 'path';

// Load .env.local
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: '.env.local', override: true });
} else {
  require('dotenv').config();
}

import { r2Client } from '../config/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { env } from '../config/env';

async function testConnection() {
  console.log('Testing connection to Cloudflare R2...');
  console.log('Bucket Name:', env.R2_BUCKET_NAME);
  console.log('Account ID:', env.R2_ACCOUNT_ID);

  try {
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      MaxKeys: 5
    });

    const response = await r2Client.send(command);
    console.log('\n✅ Connection Successful!');
    console.log('Objects in bucket:', response.Contents ? response.Contents.length : 0);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log('First few objects:');
      response.Contents.forEach(obj => console.log(` - ${obj.Key}`));
    }
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error(error);
  }
}

testConnection();
