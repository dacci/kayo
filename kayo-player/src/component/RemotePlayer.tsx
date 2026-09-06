import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import { type ModalProps } from '@mui/material/Modal';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useCallback, useContext, useEffect, useState } from 'react';

import CastContext from '../context/CastContext';
import { formatTime } from '../util';

export interface RemotePlayerProps {
  readonly source?: string;
  readonly title?: string;
  readonly onClose?: ModalProps['onClose'];
}

function RemotePlayer(props: RemotePlayerProps) {
  const { playerController } = useContext(CastContext);

  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [canPause, setCanPause] = useState(false);
  const [canSeek, setCanSeek] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handlePlayerEvent = useCallback((e: cast.framework.RemotePlayerChangedEvent) => {
    switch (e.field) {
      case 'isMediaLoaded':
        setIsMediaLoaded(e.value);
        break;

      case 'canPause':
        setCanPause(e.value);
        break;

      case 'canSeek':
        setCanSeek(e.value);
        break;

      case 'currentTime':
        if (!dragging) setCurrentTime(e.value);
        break;

      case 'duration':
        setDuration(e.value);
        break;

      case 'isPaused':
        setIsPaused(e.value);
        break;

      default:
        console.debug(e.field, e.value);
        break;
    }
  }, [dragging]);

  const seekTo = (time: number) => new Promise((resolve, reject) => {
    const request = new chrome.cast.media.SeekRequest();
    request.currentTime = time;
    window.cast.framework.CastContext
      .getInstance()
      .getCurrentSession()!
      .getMediaSession()!
      .seek(request, resolve as () => void, reject);
  });

  useEffect(() => {
    playerController!.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, handlePlayerEvent);
    return () => playerController!.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, handlePlayerEvent);
  }, [playerController, handlePlayerEvent]);

  useEffect(() => {
    const session = window.cast?.framework.CastContext
      .getInstance()
      .getCurrentSession();
    if (props.source) {
      const media = new chrome.cast.media.MediaInfo(props.source, '');
      const request = new chrome.cast.media.LoadRequest(media);
      session!.loadMedia(request).catch(e => console.error(e));
    }

    return () => {
      session!.getMediaSession()?.stop(new chrome.cast.media.StopRequest(), () => {}, e => console.error(e));
    };
  }, [props.source]);

  return (
    <Dialog
      fullWidth
      open
      onClose={props.onClose}
    >
      <Stack>
        <Typography variant="h6" sx={{ margin: 1 }}>{props.title}</Typography>
        <Toolbar variant="dense" disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box>
            <IconButton
              disabled={!isMediaLoaded || !canPause}
              onClick={() => playerController?.playOrPause()}
            >
              {!isMediaLoaded || isPaused ? <PlayArrowIcon /> : <PauseIcon />}
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
          </Box>
          <Box sx={{ display: 'inline-flex', padding: 1 }}>
            {`${formatTime(currentTime)} / ${formatTime(duration)}`}
          </Box>
        </Toolbar>
        <Box sx={{ paddingX: 3 }}>
          <Slider
            disabled={!canSeek}
            max={duration}
            value={currentTime}
            valueLabelDisplay="auto"
            valueLabelFormat={v => formatTime(v)}
            onChange={(_, value) => {
              setDragging(true);
              setCurrentTime(value as number);
            }}
            onChangeCommitted={(_, value) => {
              setDragging(false);
              return seekTo(value as number);
            }}
          />
        </Box>
      </Stack>
    </Dialog>
  );
}

export default RemotePlayer;
