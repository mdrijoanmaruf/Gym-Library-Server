import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

export class R2Service {
  /**
   * Generates a pre-signed URL for GET requests (streaming/downloading).
   * @param r2Key The object key in R2
   * @param expiresIn The expiry time in seconds
   * @returns Pre-signed URL string
   */
  static async generatePresignedGetUrl(
    r2Key: string,
    expiresIn: number = parseInt(env.PRESIGNED_URL_EXPIRES)
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
    });
    
    // If public domain is set, you might just return `${env.R2_PUBLIC_DOMAIN}/${r2Key}`
    // But we are sticking to Option A (pre-signed URLs).
    return getSignedUrl(r2Client, command, { expiresIn });
  }

  /**
   * Generates a pre-signed URL for PUT requests (uploading).
   * @param r2Key The object key in R2
   * @param contentType The MIME type of the file
   * @param expiresIn The expiry time in seconds
   * @returns Pre-signed URL string
   */
  static async generatePresignedPutUrl(
    r2Key: string,
    contentType: string,
    expiresIn: number = parseInt(env.PRESIGNED_URL_EXPIRES)
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: contentType,
    });
    return getSignedUrl(r2Client, command, { expiresIn });
  }

  /**
   * Deletes an object from R2.
   * @param r2Key The object key in R2
   */
  static async deleteObject(r2Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
    });
    await r2Client.send(command);
  }

  /**
   * Gets an object stream from R2 with an optional Range header.
   * @param r2Key The object key in R2
   * @param range The HTTP Range header string (e.g. "bytes=0-1000")
   */
  static async getObjectStream(r2Key: string, range?: string) {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
      Range: range,
    });
    return await r2Client.send(command);
  }

  /**
   * Lists objects in the bucket with a given prefix.
   * @param prefix The prefix to list (e.g., 'videos/abs/')
   * @returns Array of object keys
   */
  static async listObjects(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Prefix: prefix,
    });
    const response = await r2Client.send(command);
    if (!response.Contents) return [];
    
    return response.Contents
      .map(item => item.Key)
      .filter((key): key is string => !!key);
  }
}
