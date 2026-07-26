import { Link, ScrollRestoration, useLoaderData } from 'react-router-dom';

import { GetObjectCommand, type ListObjectsV2CommandOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

const basename = (path: string) => path.split('/').reverse().find(s => s.length);

interface MediaChooserProps {
  readonly s3Client: S3Client;
  readonly bucket: string;
}

function MediaChooser({ s3Client, bucket }: MediaChooserProps) {
  const res = useLoaderData() as ListObjectsV2CommandOutput;

  const play = async (path: string) =>
    await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    }), {
      expiresIn: 86400,
    }).then(url => {
      const media = new window.chrome.cast.media.MediaInfo(url, '');
      const request = new window.chrome.cast.media.LoadRequest(media);
      return window.cast.framework.CastContext
        .getInstance()
        .getCurrentSession()
        ?.loadMedia(request);
    }).catch(console.error);

  return (
    <>
      <ScrollRestoration />
      <List>
        {res.CommonPrefixes?.map((p, i) => (
          <ListItem key={i}>
            <ListItemButton component={Link} to={encodeURIComponent(basename(p.Prefix!)!)} relative='path'>
              <ListItemIcon><FolderIcon /></ListItemIcon>
              <ListItemText>{basename(p.Prefix!)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
        {res.Contents?.map((o, i) => (
          <ListItem key={i}>
            <ListItemButton onClick={() => play(o.Key!, basename(o.Key!))}>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText>{basename(o.Key!)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
}

export default MediaChooser;
