import { type ReactNode, useEffect, useMemo, useState } from 'react';

import CastContext, { type CastContextProps } from './CastContext';

interface CastProviderProps {
  readonly children?: ReactNode | ReactNode[];
  readonly receiverApplicationId?: string;
}

function CastProvider({ children, receiverApplicationId }: CastProviderProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    window['__onGCastApiAvailable'] = (available) => {
      if (available) setAvailable(true);
    };
  }, []);

  const value = useMemo<CastContextProps>(() => {
    let player, playerController;
    if (available) {
      const castContext = window.cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: receiverApplicationId || window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      player = new window.cast.framework.RemotePlayer();
      playerController = new window.cast.framework.RemotePlayerController(player);
    }

    return {
      available,
      player,
      playerController,
    };
  }, [receiverApplicationId, available]);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export default CastProvider;
