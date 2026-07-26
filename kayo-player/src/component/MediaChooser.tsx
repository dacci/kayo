import { useState } from 'react';
import { Link, ScrollRestoration, useLoaderData } from 'react-router-dom';

import { GetObjectCommand, type ListObjectsV2CommandOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
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

  const [showPlayer, setShowPlayer] = useState(false);
  const [source, setSource] = useState<string | undefined>();
  const [title, setTitle] = useState<string | undefined>();

  const play = async (path: string, title: string) =>
    await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    }), {
      expiresIn: 86400,
    }).then(url => {
      const session = window.cast.framework.CastContext
        .getInstance()
        .getCurrentSession();
      if (session) {
        const media = new window.chrome.cast.media.MediaInfo(url, '');
        const request = new window.chrome.cast.media.LoadRequest(media);
        return session.loadMedia(request);
      } else {
        setSource(url);
        setTitle(title);
        setShowPlayer(true);
      }
    }).catch(console.error);

  const handleClose = () => {
    setSource(undefined);
    setTitle('');
    setShowPlayer(false);
  };

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
            <ListItemButton onClick={() => play(o.Key!, basename(o.Key!)!)}>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText>{basename(o.Key!)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog fullScreen open={showPlayer}>
        <DialogTitle>{title}</DialogTitle>
        <IconButton
          aria-label='close'
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ overflow: 'hidden' }}>
          <video autoPlay controls style={{ width: '100%', height: '100%' }}>
            <source src={source} />
          </video>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MediaChooser;
