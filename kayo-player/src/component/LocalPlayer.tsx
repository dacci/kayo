import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import CloseIcon from '@mui/icons-material/Close';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { type KeyboardEventHandler, type ReactEventHandler, useRef, useState } from 'react';

import { formatTime } from '../util';

export interface LocalPlayerProps {
  readonly source?: string;
  readonly title?: string;
  readonly onClose?: () => void;
}

function LocalPlayer(props: LocalPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);

  const [duration, setDuration] = useState(0);
  const handleLoadedMetadata: ReactEventHandler<HTMLVideoElement> = (e) => {
    setDuration(e.currentTarget.duration);
  };

  const [currentTime, setCurrentTime] = useState(0);
  const [dragging, setDragging] = useState(false);
  const handleTimeUpdate: ReactEventHandler<HTMLVideoElement> = (e) => {
    if (!dragging) setCurrentTime(e.currentTarget.currentTime);
  };

  const [playing, setPlaying] = useState(false);
  const playOrPause = () => {
    if (playing) {
      video.current?.pause();
    } else {
      video.current?.play();
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    switch (e.key) {
      case '0':
        video.current!.currentTime = 0;
        break;

      case '1':
        video.current!.currentTime = duration * 0.1;
        break;

      case '2':
        video.current!.currentTime = duration * 0.2;
        break;

      case '3':
        video.current!.currentTime = duration * 0.3;
        break;

      case '4':
        video.current!.currentTime = duration * 0.4;
        break;

      case '5':
        video.current!.currentTime = duration * 0.5;
        break;

      case '6':
        video.current!.currentTime = duration * 0.6;
        break;

      case '7':
        video.current!.currentTime = duration * 0.7;
        break;

      case '8':
        video.current!.currentTime = duration * 0.8;
        break;

      case '9':
        video.current!.currentTime = duration * 0.9;
        break;
    }
  };

  const [controlVisible, setControlVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const timeoutRef = useRef(0);
  const resetTimer = () => {
    setControlVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!hovering) {
      timeoutRef.current = setTimeout(() => setControlVisible(false), 2500);
    }
  };

  const [bisectRatio, setBisectRatio] = useState(0);
  const [bisectPos, setBisectPos] = useState(0);
  const bisectReset = () => {
    video.current!.currentTime = duration * 0.5;
    setBisectRatio(0.5);
    setBisectPos(0.5);
  };
  const bisect = (dir: number) => {
    const ratio = bisectRatio / 2;
    const pos = bisectPos + ratio * Math.sign(dir);
    video.current!.currentTime = duration * pos;
    setBisectRatio(ratio);
    setBisectPos(pos);
  };

  return (
    <Dialog
      fullScreen
      open
      onClose={props.onClose}
      onKeyDown={handleKeyDown}
      onMouseMove={() => resetTimer()}
      onTouchMove={() => resetTimer()}
    >
      <Box sx={{ height: '100%' }}>
        <video
          ref={video}
          autoPlay
          controls={false}
          playsInline
          disableRemotePlayback
          style={{ width: '100%', height: '100%' }}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={props.source} />
        </video>
      </Box>
      <Toolbar
        variant="dense"
        sx={{
          position: 'absolute',
          top: 0,
          width: '100%',
          opacity: controlVisible ? 1 : 0,
          visibility: controlVisible ? 'visible' : 'hidden',
          transition: '250ms cubic-bezier(0, .25, .25, 1)',
          transitionProperty: 'opacity, visibility',
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>{props.title}</Typography>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="close"
          onClick={props.onClose}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Stack
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          opacity: controlVisible ? 1 : 0,
          visibility: controlVisible ? 'visible' : 'hidden',
          transition: '250ms cubic-bezier(0, .25, .25, 1)',
          transitionProperty: 'opacity, visibility',
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Toolbar variant="dense">
          <Slider
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
              video.current!.currentTime = value as number;
            }}
          />
        </Toolbar>
        <Toolbar
          variant="dense"
          sx={{ justifyContent: 'space-between' }}
        >
          <Box>
            <IconButton onClick={playOrPause}>
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={() => video.current!.currentTime -= 10}>
              <FastRewindIcon />
            </IconButton>
            <IconButton onClick={() => video.current!.currentTime += 10}>
              <FastForwardIcon />
            </IconButton>
            <Box>
              {`${formatTime(currentTime)} / ${formatTime(duration)}`}
            </Box>
          </Box>
          <Box>
            <IconButton onClick={() => bisectReset()}>
              <SearchIcon />
            </IconButton>
            <IconButton
              disabled={bisectRatio === 0}
              onClick={() => bisect(-1)}
            >
              <ArrowCircleLeftIcon />
            </IconButton>
            <IconButton
              disabled={bisectRatio === 0}
              onClick={() => bisect(1)}
            >
              <ArrowCircleRightIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Stack>
    </Dialog>
  );
}

export default LocalPlayer;
