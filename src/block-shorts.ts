import { ResolveCommandRegistry, type ResolveCommandHook } from './app_api';
import { configRead } from './config';
import { getPlayerManager, PlayerMode } from './player_api';
import { showNotification } from './ui';
import { isShortsCommand } from './shorts-shared';

let lastBlockNoticeAt = 0;

function shouldBlockShorts() {
  return configRead('blockShorts');
}

function notifyShortsBlocked(reason: string) {
  const now = Date.now();
  if (now - lastBlockNoticeAt < 1500) return;

  lastBlockNoticeAt = now;
  console.info(`[shorts] Blocked Shorts ${reason}`);
  showNotification('Shorts blocked', 2000, 'grey');
}

const hook: ResolveCommandHook = function (resolveCommand, payload, extra) {
  if (!shouldBlockShorts()) {
    return resolveCommand(payload, extra);
  }

  if (!isShortsCommand(payload)) {
    return resolveCommand(payload, extra);
  }

  notifyShortsBlocked('command');
  return true;
};

const registry = await ResolveCommandRegistry.getInstance();
registry.setHook('reelWatchEndpoint', hook);
registry.setHook('browseEndpoint', hook);
registry.setHook('watchEndpoint', hook);
registry.setHook('commandExecutorCommand', hook);

const playerManager = await getPlayerManager();

function exitShortsPlayback() {
  const player = playerManager.player as typeof playerManager.player & {
    stopVideo?: () => void;
    pauseVideo?: () => void;
  };

  try {
    if (typeof player.stopVideo === 'function') {
      player.stopVideo();
    } else if (typeof player.pauseVideo === 'function') {
      player.pauseVideo();
    }
  } catch (err) {
    console.warn('[shorts] Failed to stop playback directly', err);
  }

  if (window.history.length > 1) {
    window.history.back();
  }
}

function handlePlaybackStart() {
  if (!shouldBlockShorts()) return;
  if (playerManager.playerMode !== PlayerMode.SHORTS) return;

  notifyShortsBlocked('playback');
  exitShortsPlayback();
}

playerManager.addEventListener('playbackStart', handlePlaybackStart);
