import { useContext, useEffect, useState } from 'react';

import CastContext from '../context/CastContext';
import LocalPlayer from './LocalPlayer';
import RemotePlayer from './RemotePlayer';

export interface PlayerProps {
  readonly open: boolean;
  readonly source?: string;
  readonly title?: string;
  readonly onClose?: () => void;
}

function Player(props: PlayerProps) {
  const { player, playerController } = useContext(CastContext);
  const [connected, setConnected] = useState(player?.isConnected || false);

  const isConnectedChanged = (event: cast.framework.RemotePlayerChangedEvent) => {
    setConnected(event.value);
  };

  useEffect(() => {
    if (!playerController) return;

    playerController.addEventListener(window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, isConnectedChanged);
    return () => playerController.removeEventListener(window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, isConnectedChanged);
  }, [playerController]);

  return props.source && (
    connected
      ? <RemotePlayer source={props.source} title={props.title} onClose={props.onClose} />
      : <LocalPlayer source={props.source} title={props.title} onClose={props.onClose} />
  );
}

export default Player;
