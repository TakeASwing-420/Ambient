import React, { useEffect, useState } from "react";
import { appwriteDatabases } from "../storage/appwriteConfig";

interface TrackType {
  $id: string;
  trackName: string;
  duration: number; // in seconds
  // Add more fields if needed
}

interface PlaylistType {
  $id: string;
  name: string;
  initTracks: TrackType[]; // Relationship-resolved objects
}

interface Props {
  playlistId: string;
}

const PlaylistTracks: React.FC<Props> = ({ playlistId }) => {
  const [tracks, setTracks] = useState<TrackType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylistTracks = async () => {
    try {
      const playlist: PlaylistType = await appwriteDatabases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId
      );

      const relatedTracks = playlist.initTracks || [];

      setTracks(relatedTracks);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistTracks();
  }, [playlistId]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full mt-4">
      {loading ? (
        <p className="text-gray-500">Loading tracks...</p>
      ) : tracks.length === 0 ? (
        <div className="text-center py-10 text-gray-600 font-medium">
          🎵 This playlist has no tracks yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.$id}
              className="flex justify-between items-center px-4 py-3 border rounded-md shadow-sm hover:shadow transition"
            >
              <p className="text-sm font-medium">{track.trackName}</p>
              <span className="text-xs text-gray-500">
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistTracks;
