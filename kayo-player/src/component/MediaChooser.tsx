import { type _Object, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Link, ScrollRestoration, useLoaderData } from 'react-router';

const basename = (path: string) => path.split('/').reverse().find(s => s.length)!;

export interface MediaChooserProps {
  readonly onMediaSelected?: (path: string, title: string) => void;
}

function MediaChooser(props: MediaChooserProps) {
  const res = useLoaderData() as ListObjectsV2CommandOutput;

  const onMediaSelected = (o: _Object) => {
    if (props.onMediaSelected) {
      props.onMediaSelected(o.Key!, basename(o.Key!));
    }
  };

  return (
    <Box
      sx={{
        'mt': { xs: 7, sm: 8 },
        '@media (orientation: landscape)': { mt: { xs: 6, sm: 8 } },
      }}
    >
      <ScrollRestoration />
      <List>
        {res.CommonPrefixes?.map((p, i) => (
          <ListItem key={i}>
            <ListItemButton component={Link} to={encodeURIComponent(basename(p.Prefix!))} relative="path">
              <ListItemIcon><FolderIcon /></ListItemIcon>
              <ListItemText>{basename(p.Prefix!)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
        {res.Contents?.map((o, i) => (
          <ListItem key={i}>
            <ListItemButton onClick={() => onMediaSelected(o)}>
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText>{basename(o.Key!)}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default MediaChooser;
