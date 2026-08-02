import { useContext, useEffect, useRef, useState } from 'react';
import { Link, ScrollRestoration, useLoaderData, useLocation } from 'react-router-dom';

import { GetObjectCommand, type ListObjectsV2CommandOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { CastContext } from '../context';

const basename = (path: string) => path.split('/').reverse().find(s => s.length)!;

interface MediaChooserProps {
  readonly s3Client: S3Client;
  readonly bucket: string;
}

function MediaChooser({ s3Client, bucket }: MediaChooserProps) {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef(0);
  const resetTimer = () => {
    setVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setVisible(false), 2500);
  };

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
      const session = window.cast?.framework.CastContext
        .getInstance()
        .getCurrentSession();
      if (session) {
        const media = new window.chrome.cast.media.MediaInfo(url, '');
        const request = new window.chrome.cast.media.LoadRequest(media);
        return session.loadMedia(request);
      } else {
        resetTimer();
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

  const path = useLocation();
  useEffect(() => handleClose, [path]);

  const { available } = useContext(CastContext);

  return (
    <Box
      sx={available ? {
        pb: { xs: 7, sm: 8 },
        '@media (orientation: landscape)': {
          pb: { xs: 6, sm: 8 },
        }
      } : undefined}
    >
      <ScrollRestoration />
      <List>
        {res.CommonPrefixes?.map((p, i) => (
          <ListItem key={i}>
            <ListItemButton component={Link} to={encodeURIComponent(basename(p.Prefix!))} relative='path'>
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
      <Dialog
        fullScreen
        open={showPlayer}
        onMouseMove={() => resetTimer()}
        onTouchStart={() => resetTimer()}
      >
        <AppBar
          color='transparent'
          elevation={0}
          sx={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
          }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
              {title}
            </Typography>
            <IconButton
              edge='end'
              color='inherit'
              aria-label='close'
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <video
          autoPlay
          controls
          style={{ width: '100%', height: '100%' }}
          onLoadStart={(e) => (e.target as HTMLVideoElement).focus()}
        >
          <source src={source} />
        </video>
      </Dialog >
    </Box>
  );
}

export default MediaChooser;
