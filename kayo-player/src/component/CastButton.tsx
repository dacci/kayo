import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import IconButton from '@mui/material/IconButton';
import { useContext, useEffect, useState } from 'react';

import CastContext from '../context/CastContext';

function CastButton() {
  const { available, player, playerController } = useContext(CastContext);
  const [connected, setConnected] = useState(player?.isConnected || false);

  const isConnectedChanged = (event: cast.framework.RemotePlayerChangedEvent) => {
    setConnected(event.value);
  };

  useEffect(() => {
    if (!playerController) return;

    playerController.addEventListener(window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, isConnectedChanged);
    return () => playerController.removeEventListener(window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, isConnectedChanged);
  }, [playerController]);

  return (
    <IconButton
      disabled={!available}
      onClick={() => window.cast.framework.CastContext.getInstance().requestSession()}
    >
      {connected ? <CastConnectedIcon /> : <CastIcon />}
    </IconButton>
  );
}

export default CastButton;
