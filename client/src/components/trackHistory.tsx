import React, { useState, useEffect, FC } from "react";
import { IoPlayOutline } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { TbMusicDown } from "react-icons/tb";
import { RiVideoDownloadLine, RiDeleteBinLine } from "react-icons/ri";
import { IoShareSocial } from "react-icons/io5";
import { MdOutlineDone, MdOutlineEdit } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "@/hooks/use-toast";
import ReactTooltip from "react-tooltip";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
  appwriteDatabases,
  client,
  Query,
  account,
  storage,
} from "../storage/appwriteConfig";
import ShareModal from "./ShareModal";

const TrackHistory: FC = () => {
  const [docs, setDocs] = useState([]);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editedNames, setEditedNames] = useState({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const shareLink = (fileId: string): string => {
    const url = storage.getFileView(
      import.meta.env.VITE_APPWRITE_BUCKET_ID,
      fileId
    );
    return url;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    try {
      const user = await account.get();
      const response = await appwriteDatabases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
        [Query.equal("clientID", user.$id)]
      );
      return response.documents;
    } catch (err) {
      console.error("Error fetching data:", err);
      return [];
    }
  };

  const downloadFile = async (fileId) => {
    try {
      const url = storage.getFileDownload(
        import.meta.env.VITE_APPWRITE_BUCKET_ID,
        fileId
      );
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleUpdate = async (trackId) => {
    const newName = editedNames[trackId];
    if (!newName || newName.trim() === "") return;

    try {
      await appwriteDatabases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
        trackId,
        { trackName: newName.trim() }
      );
      setEditingTrackId(null);
      toast({
        title: "Track Renamed",
        description: "Your track name was successfully updated 🎵",
      });

      const updatedDocs = await fetchData();
      setDocs(updatedDocs);
    } catch (err) {
      console.error("Failed to update name:", err);
      toast({
        title: "Rename Failed",
        description: "Could not update the track name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (trackId, audioFileId, videoFileId) => {
    try {
      await appwriteDatabases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
        trackId
      );

      if (audioFileId)
        await storage.deleteFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          audioFileId
        );
      if (videoFileId)
        await storage.deleteFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          videoFileId
        );

      const updatedDocs = await fetchData();
      setDocs(updatedDocs);

      toast({
        title: "Track Deleted",
        description: "Track and associated files have been deleted.",
      });
      console.log("Track and files deleted successfully");
    } catch (error) {
      toast({
        title: "Error",
        description: "Cannot delete Track. Please try again!",
      });
      console.error("Error deleting track:", error);
    }
  };

  useEffect(() => {
    const getData = async () => {
      const data = await fetchData();
      setDocs(data);
    };
    getData();
  }, []);

  const handleAddToPlaylist = async (trackId: string) => {
    try {
      const user = await account.get();

      const response = await appwriteDatabases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        [Query.equal("clientID", user.$id)]
      );

      setUserPlaylists(response.documents);
      setSelectedTrackId(trackId);
    } catch (err) {
      console.error("Error fetching playlists:", err);
      toast({
        title: "Playlist Error",
        description: "Unable to fetch your playlists!",
        variant: "destructive",
      });
    }
  };

  const handlePlaylistSelection = async (playlistId: string) => {
    try {
      const playlist = await appwriteDatabases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId
      );

      // Add the selected track to the playlist's initTracks array
      const updatedTracks = playlist.initTracks
        ? [...playlist.initTracks, selectedTrackId]
        : [selectedTrackId];

      await appwriteDatabases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId,
        {
          initTracks: updatedTracks,
        }
      );

      toast({
        title: "Track Added",
        description: "Track have been successfully added to your playlist",
      });
      setSelectedTrackId(null);
    } catch (err) {
      console.error("Error adding track to playlist:", err);
      toast({
        title: "Error",
        description: "Failed to add your track to playlist!",
      });
    }
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

  const handleNativeShare = async (videoId: string, trackName: string) => {
    const url = `${window.location.origin}/embed/${videoId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Lofi Track",
          text: `Check out this lofi vibe: ${trackName}`,
          url,
        });
        console.log("Successfully shared!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      setIsShareOpen(true);
      toast({
        title: "Sharing Error",
        description: "Sharing isn't supported. Try copying link.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="w-full flex flex-col gap-4 justify-center items-center">
      <div className="w-full px-4 py-2 flex md:flex-row flex-col justify-between items-center">
        <h1 className="font-semibold md:text-2xl text-xl md:my-0 my-6">
          Your Conversion History
        </h1>
        <div className="flex justify-center items-center gap-2 text-sm">
          <p className="text-sm subText">Sort by:</p>
          <select
            name="sort"
            id="sort"
            className="p-2 rounded-lg border shadow-md sort"
          >
            <option value="Date">Date (Newest)</option>
            <option value="Title">Title (A-Z)</option>
            <option value="Duration">Duration</option>
          </select>
        </div>
      </div>

      {selectedTrackId && (
        <div className="card shadow p-6 rounded-md mt-2 fixed top-[40%]">
          <IoCloseOutline
            className="text-gray-400 hover:text-white transition-all duration-200 ease-in-out text-3xl absolute top-3 right-2"
            onClick={() => setSelectedTrackId(null)}
          />
          <h2 className="font-semibold text-sm mb-2">Add to Playlist</h2>
          <select
            onChange={(e) => handlePlaylistSelection(e.target.value)}
            className="px-2 py-1 rounded-md w-full home"
          >
            <option value="" className="card">
              Select a playlist
            </option>
            {userPlaylists.map((playlist) => (
              <option key={playlist.$id} value={playlist.$id} className="card">
                {playlist.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <VideoPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        videoUrl={previewVideoUrl}
      />

      {/* Fallback */}
      {docs.length === 0 ? (
        <div className="w-full text-center text-sm text-gray-500 py-10">
          <p className="italic">
            No tracks found in your LoFi vault. Start converting to see them
            here 🎧
          </p>
        </div>
      ) : (
        docs.map(
          (track) => (
            console.log(track),
            (
              <div
                key={track.$id}
                className="cursor-pointer bg-white rounded-md w-full shadow-lg p-5 flex md:flex-row flex-col md:gap-0 gap-4 md:justify-between justify-center items-center trackCard"
              >
                {/* Left side */}
                <div className="flex justify-center items-center gap-3">
                  <div
                    id="play-btn"
                    className="bg-purple-200 p-3 text-lg rounded-full flex justify-center items-center hover:bg-purple-300 transition-all duration-200 ease-in-out playBtn"
                    onClick={() => handlePreview(track.video)}
                  >
                    <IoPlayOutline />
                  </div>
                  <Tooltip
                    anchorSelect="#play-btn"
                    content="Play chill beats"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />

                  <div>
                    {editingTrackId === track.$id ? (
                      <input
                        value={editedNames[track.$id] ?? track.audio}
                        onChange={(e) =>
                          setEditedNames((prev) => ({
                            ...prev,
                            [track.$id]: e.target.value,
                          }))
                        }
                        className="border rounded px-2 py-1 text-sm w-[200%]"
                      />
                    ) : (
                      <h1 className="font-semibold text-lg">
                        {track.trackName}
                      </h1>
                    )}
                    <p className="text-xs subText">
                      Converted On:{" "}
                      {new Date(track.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex gap-6 justify-center items-center">
                  <p className="text-sm subText">{track.duration}s</p>
                  <IoMdAdd
                    id="add"
                    className="text-lg hover:text-purple-600"
                    onClick={() => handleAddToPlaylist(track.$id)}
                  />
                  <Tooltip
                    anchorSelect="#add"
                    content="Add to Playlist"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />

                  <TbMusicDown
                    id="audio"
                    onClick={() => downloadFile(track.audio)}
                    className="text-lg hover:text-purple-600"
                  />
                  <Tooltip
                    anchorSelect="#audio"
                    content="Download beat audio"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />

                  <RiVideoDownloadLine
                    id="video"
                    onClick={() => downloadFile(track.video)}
                    className="text-lg hover:text-purple-600"
                  />
                  <Tooltip
                    anchorSelect="#video"
                    content="Download beat video"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />

                  <IoShareSocial
                    id="share"
                    className="text-lg hover:text-purple-600"
                    // onClick={() => setIsShareOpen(true)}
                    onClick={() =>
                      handleNativeShare(track.video, track.trackName)
                    }
                  />
                  <Tooltip
                    anchorSelect="#share"
                    content="Share your Beat"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />

                  <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    videoUrl={shareLink(track.video)}
                  />
                  {editingTrackId === track.$id ? (
                    <>
                      <MdOutlineDone
                        id="done"
                        onClick={() => handleUpdate(track.$id)}
                        className="text-lg hover:text-green-600"
                      />
                      <Tooltip
                        anchorSelect="#done"
                        content="Confirm Beat Name"
                        place="top"
                        className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                      />
                    </>
                  ) : (
                    <>
                      <MdOutlineEdit
                        id="edit"
                        onClick={() => {
                          setEditingTrackId(track.$id);
                          setEditedNames((prev) => ({
                            ...prev,
                            [track.$id]: track.audio,
                          }));
                        }}
                        className="text-lg hover:text-purple-600"
                      />
                      <Tooltip
                        anchorSelect="#edit"
                        content="Edit Beat Name"
                        place="top"
                        className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                      />
                    </>
                  )}
                  <RiDeleteBinLine
                    id="delete"
                    className="text-lg hover:text-red-500"
                    onClick={() =>
                      handleDelete(track.$id, track.audio, track.video)
                    }
                  />
                  <Tooltip
                    anchorSelect="#delete"
                    content="Delete your Beat"
                    place="top"
                    className="!transition-all !duration-300 ease-in-out !px-2 !py-1"
                  />
                </div>
              </div>
            )
          )
        )
      )}
    </main>
  );
};

export default TrackHistory;
