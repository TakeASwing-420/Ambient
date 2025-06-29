import React, { useEffect, useState } from "react";
import { IoPlayOutline } from "react-icons/io5";
import { appwriteDatabases, storage } from "../storage/appwriteConfig";

interface TrackType {
  $id: string;
  trackName: string;
  video: string;
  duration: number;
}

interface PlaylistType {
  $id: string;
  name: string;
  initTracks: TrackType[];
}

interface Props {
  playlistId: string;
  onBack: () => void;
}

const PlaylistTracks: React.FC<Props> = ({ playlistId, onBack }) => {
  const [tracks, setTracks] = useState<TrackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const fetchPlaylistTracks = async () => {
    try {
      const playlist: PlaylistType = await appwriteDatabases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId
      );

      setPlaylistName(playlist.name);

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

  const handlePreview = (videoFileId: string) => {
    const url = storage.getFileView(
      import.meta.env.VITE_APPWRITE_BUCKET_ID,
      videoFileId
    );
    setPreviewVideoUrl(url);
    setIsPreviewOpen(true);
  };

  const VideoPreviewModal = ({
    isOpen,
    onClose,
    videoUrl,
  }: {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string | null;
  }) => {
    if (!isOpen || !videoUrl) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
        <div className="flowing-gradient3 backdrop-blur-lg rounded-md p-2 w-full max-w-2xl shadow-lg relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-white hover:text-red-500 text-3xl z-[10]"
          >
            &times;
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full rounded-md z-[9]"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-4">
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-poppins font-bold my-4">{playlistName.trim().split(" ").filter(Boolean).slice(0, -1).join(" ")}{" "} <span className="purpleTitle">{playlistName.trim().split(" ").filter(Boolean).slice(-1)}</span></h2>
        <button className="darkBtn my-4 px-3 py-2 rounded-lg" onClick={onBack}>
          All Playlists
        </button>
      </div>

      <VideoPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        videoUrl={previewVideoUrl}
      />

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
              className="flex justify-between trackCard items-center px-4 py-3 rounded-md shadow-sm hover:shadow transition"
            >
              <div className="flex gap-6 justify-center items-center">
                <div
                  className="bg-purple-200 p-3 text-lg rounded-full flex justify-center items-center hover:bg-purple-300 transition-all duration-200 ease-in-out playBtn"
                  onClick={() => handlePreview(track.video)}
                >
                  <IoPlayOutline />
                </div>
                <p className="text-base font-medium">{track.trackName}</p>
              </div>
              <span className="text-xs text-gray-200">
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