import ytdl from "ytdl-core";
import { createAudioResource } from "@discordjs/voice";
import { queue } from "./index";

export const play = (guildId: string) => {
  const queueItem = queue.get(guildId);

  if (!queueItem || queueItem?.playlist.length === 0) {
    console.error(`No Playlist found for guildId: ${guildId}`);
    return;
  }

  const url = queueItem.playlist[0].url;
  const player = queueItem.player;

  const resource = createAudioResource(
    ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    })
  );

  player.play(resource);
};

export const getNextResource = (guildId: string) => {
  const queueItem = queue.get(guildId);

  if (!queueItem) return;

  queueItem.playlist.shift();

  if (queueItem.playlist.length === 0) {
    queue.delete(guildId);
  } else {
    play(guildId);
  }
};
