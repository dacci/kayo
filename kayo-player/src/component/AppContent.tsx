import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { getMediaUrl } from '../api';
import Controller from './Controller';
import MediaChooser from './MediaChooser';
import Player from './Player';

function AppContent() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [source, setSource] = useState<string | undefined>();
  const [title, setTitle] = useState<string | undefined>();

  const play = (path: string, title: string) =>
    getMediaUrl(path)
      .then((url) => {
        setSource(url);
        setTitle(title);
        setShowPlayer(true);
      });

  const handleClose = () => {
    setSource(undefined);
    setTitle('');
    setShowPlayer(false);
  };

  const path = useLocation();
  useEffect(() => handleClose, [path]);

  return (
    <>
      <Controller />
      <MediaChooser onMediaSelected={play} />
      <Player
        open={showPlayer}
        source={source}
        title={title}
        onClose={handleClose}
      />
    </>
  );
}

export default AppContent;
