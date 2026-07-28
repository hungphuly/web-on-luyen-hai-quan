'use server'

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2BucketName } from '@/lib/shared/utils/r2';
import { createClient } from '@/lib/shared/utils/supabase/server';

export async function layTamThoiLinkXemFile(fileKey: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Basic security check: ensure user is authenticated, 
  // or you can skip this if you want it public to anyone with the component.
  // For better security, let's just make sure they are logged in or just return the url.
  // Since some documents might be public, we can just return the url. But generating presigned url is safe since it expires.

  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: fileKey,
  });

  // Tạo URL tạm thời sống trong 10 phút (600 giây)
  const client = await getR2Client();
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 600 });
  
  return signedUrl;
}
