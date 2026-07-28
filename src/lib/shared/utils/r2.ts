import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.warn('Thiếu cấu hình R2. Vui lòng thêm R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY vào file .env.local');
}

export async function getR2Client() {
  // Gán process.env ra một biến để tránh Webpack statically replace thành undefined lúc build
  const env = process.env;
  
  const accountId = env['R2_ACCOUNT_ID'];
  const accessKey = env['R2_ACCESS_KEY_ID'];
  const secretKey = env['R2_SECRET_ACCESS_KEY'];
  const bucketName = env['R2_BUCKET_NAME'];

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('THIẾU BIẾN MÔI TRƯỜNG TRÊN CLOUDFLARE: Vui lòng kiểm tra lại Settings -> Environment variables trên Cloudflare Pages. Bạn cần khai báo đủ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

export function getR2BucketName() {
  const env = process.env;
  return env['R2_BUCKET_NAME'] || 'tai-lieu-hoc-tap';
}

/**
 * Upload một file (dạng Buffer) lên Cloudflare R2
 * @param fileBuffer Uint8Array hoặc Buffer của file cần upload
 * @param fileName Tên file (VD: 'van-ban/file.pdf')
 * @param contentType Kiểu nội dung (VD: 'application/pdf')
 * @returns fileKey (đường dẫn lưu trong DB)
 */
export async function uploadToR2(fileBuffer: Uint8Array | Buffer, fileName: string, contentType: string = 'application/pdf'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  const client = await getR2Client();
  await client.send(command);
  return fileName;
}
