import React, {ReactNode, useEffect, useMemo, useState} from 'react';
import CastContext from './CastContext';

interface CastProviderProps {
  readonly children?: ReactNode | ReactNode[];
  readonly receiverApplicationId?: string;
}

function CastProvider({children, receiverApplicationId}: CastProviderProps) {
  const [available, setAvailable] = useState(false);
  const [player, setPlayer] = useState<cast.framework.RemotePlayer>();
  const [playerController, setPlayerController] = useState<cast.framework.RemotePlayerController>();

  useEffect(() => {
    window['__onGCastApiAvailable'] = (available) => {
      if (available) setAvailable(true);
    };
  }, []);

  useEffect(() => {
    if (!(window.cast && window.chrome.cast && window.cast)) return;

    const castContext = window.cast.framework.CastContext.getInstance();
    castContext.setOptions({
      receiverApplicationId: receiverApplicationId || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    const player = new window.cast.framework.RemotePlayer();
    setPlayer(player);
    setPlayerController(new window.cast.framework.RemotePlayerController(player));
  }, [receiverApplicationId, available]);

  const value = useMemo(() => ({
    available,
    player,
    playerController,
  }), [available, player, playerController]);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>
}

export default CastProvider;
