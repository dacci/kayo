import { useContext, useEffect, useState } from 'react';

import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AppBar from '@mui/material/AppBar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Toolbar from '@mui/material/Toolbar';

import { CastContext } from '../context';

function CastControl() {
  const {
    available,
    player,
    playerController,
  } = useContext(CastContext);

  const [connected, isConnected] = useState(player?.isConnected || false);
  const [mediaLoaded, isMediaLoaded] = useState(player?.isMediaLoaded || false);
  const [duration, setDuration] = useState(player?.duration || 0);
  const [currentTime, setCurrentTime] = useState(player?.currentTime || 0);
  const [paused, isPaused] = useState(player?.isPaused || false);
  const [canPause, setCanPause] = useState(player?.canPause || false);
  const [canSeek, setCanSeek] = useState(player?.canSeek || false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!playerController) return;

    const onRemotePlayerChanged = (event: cast.framework.RemotePlayerChangedEvent) => {
      switch (event.field) {
        case 'isConnected':
          isConnected(event.value);
          break;

        case 'isMediaLoaded':
          isMediaLoaded(event.value);
          isPaused(false);
          break;

        case 'duration':
          setDuration(event.value);
          break;

        case 'currentTime':
          if (!dragging) setCurrentTime(event.value);
          break;

        case 'isPaused':
          isPaused(event.value);
          break;

        case 'canPause':
          setCanPause(event.value);
          break;

        case 'canSeek':
          setCanSeek(event.value);
          break;
      }
    };
    playerController.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, onRemotePlayerChanged);
    return () => playerController.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, onRemotePlayerChanged);
  }, [playerController, dragging]);

  const seekTo = (time: number) => new Promise((resolve, reject) => {
    const request = new window.chrome.cast.media.SeekRequest();
    request.currentTime = time;
    window.cast.framework.CastContext
      .getInstance()
      .getCurrentSession()
      ?.getMediaSession()
      ?.seek(request, resolve as () => void, reject);
  });

  return available && (
    <AppBar position="fixed" sx={{ top: 'auto', bottom: 0 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          onClick={() => window.cast.framework.CastContext.getInstance().requestSession()}
        >
          {connected ? <CastConnectedIcon /> : <CastIcon />}
        </IconButton>
        <Divider
          orientation="vertical"
          sx={{ mx: 1 }}
        />
        <IconButton
          disabled={!mediaLoaded || !canPause}
          onClick={() => playerController?.playOrPause()}
        >
          {!mediaLoaded || paused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>
        <IconButton
          disabled={!mediaLoaded}
          onClick={() => playerController?.stop()}
        >
          <StopIcon />
        </IconButton>
        <IconButton
          disabled={!canSeek}
          onClick={() => seekTo(currentTime - 10)}
        >
          <FastRewindIcon />
        </IconButton>
        <IconButton
          disabled={!canSeek}
          onClick={() => seekTo(currentTime + 10)}
        >
          <FastForwardIcon />
        </IconButton>
        <Divider
          orientation="vertical"
          sx={{ mx: 1 }}
        />
        <Slider
          disabled={!canSeek}
          max={duration}
          value={currentTime}
          valueLabelDisplay="auto"
          valueLabelFormat={value => playerController?.getFormattedTime(value)}
          onChange={(_, value) => {
            setDragging(true);
            setCurrentTime(value as number);
          }}
          onChangeCommitted={(_, value) => {
            setDragging(false);
            return seekTo(value as number);
          }}
        />
      </Toolbar>
    </AppBar>
  );
}

export default CastControl;
