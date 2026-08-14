import { GetObjectCommand, ListObjectsV2Command, type ListObjectsV2Output, S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = import.meta.env.VITE_APP_BUCKET || 'contents';

const s3 = (() => {
  if (import.meta.env.VITE_APP_IDENTITY_POOL_ID) {
    const region = import.meta.env.VITE_APP_IDENTITY_POOL_ID.split(':')[0];
    return new S3Client({
      region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: import.meta.env.VITE_APP_IDENTITY_POOL_ID,
        clientConfig: { region },
      }),
    });
  } else {
    return new S3Client({
      region: 'us-east-1',
      endpoint: import.meta.env.VITE_APP_API_ENDPOINT || window.location.origin + window.location.pathname + 'api',
      forcePathStyle: true,
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
      },
      signer: {
        async sign(requestToSign) {
          return requestToSign;
        },
      },
    });
  }
})();

export function listObjects(prefix: string | undefined): Promise<ListObjectsV2Output> {
  return s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    Delimiter: '/',
  }));
}

export function getMediaUrl(path: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET,
    Key: path,
  }), {
    expiresIn: 86400,
  });
}
