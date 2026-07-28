import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.warn('Thiếu cấu hình R2. Vui lòng thêm R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY vào file .env.local');
}

export function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

export function getR2BucketName() {
  return process.env.R2_BUCKET_NAME || 'tai-lieu-hoc-tap';
}

/**
 * Upload một file (dạng Buffer) lên Cloudflare R2
 * @param fileBuffer Buffer của file cần upload
 * @param fileName Tên file (VD: 'van-ban/file.pdf')
 * @param contentType Kiểu nội dung (VD: 'application/pdf')
 * @returns fileKey (đường dẫn lưu trong DB)
 */
export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string = 'application/pdf'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await getR2Client().send(command);
  return fileName;
}
