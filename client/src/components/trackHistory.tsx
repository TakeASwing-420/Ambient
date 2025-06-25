import React, { useState, useEffect, FC } from "react";
import { IoPlayOutline } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { FiDownload } from "react-icons/fi";
import { TbMusicDown } from "react-icons/tb";
import { RiVideoDownloadLine, RiDeleteBinLine } from "react-icons/ri";
import { IoShareSocial } from "react-icons/io5";
import { MdOutlineDone, MdOutlineEdit } from "react-icons/md";
import { toast } from "@/hooks/use-toast";
import {
  appwriteDatabases,
  client,
  Query,
  account,
  storage,
} from "../storage/appwriteConfig";

const TrackHistory: FC = () => {
  const [docs, setDocs] = useState([]);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editedNames, setEditedNames] = useState({});

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

      {/* Fallback */}
      {docs.length === 0 ? (
        <div className="w-full text-center text-sm text-gray-500 py-10">
          <p className="italic">
            No tracks found in your LoFi vault. Start converting to see them
            here 🎧
          </p>
        </div>
      ) : (
        docs.map((track) => (
          <div
            key={track.$id}
            className="cursor-pointer bg-white w-full shadow-lg p-5 flex md:flex-row flex-col md:gap-0 gap-4 md:justify-between justify-center items-center trackCard"
          >
            {/* Left side */}
            <div className="flex justify-center items-center gap-3">
              <div className="bg-purple-200 p-3 text-lg rounded-full flex justify-center items-center hover:bg-purple-300 transition-all duration-200 ease-in-out playBtn">
                <IoPlayOutline />
              </div>
              <div>
                {editingTrackId === track.$id ? (
                  <input
                    value={editedNames[track.$id] ?? track.trackName}
                    onChange={(e) =>
                      setEditedNames((prev) => ({
                        ...prev,
                        [track.$id]: e.target.value,
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm w-[200%]"
                  />
                ) : (
                  <h1 className="font-semibold text-lg">{track.trackName}</h1>
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
              <IoMdAdd className="text-lg hover:text-purple-600" />
              <TbMusicDown
                onClick={() => downloadFile(track.audio)}
                className="text-lg hover:text-purple-600"
              />
              <RiVideoDownloadLine
                onClick={() => downloadFile(track.video)}
                className="text-lg hover:text-purple-600"
              />
              <IoShareSocial className="text-lg hover:text-purple-600" />
              {editingTrackId === track.$id ? (
                <MdOutlineDone
                  onClick={() => handleUpdate(track.$id)}
                  className="text-lg hover:text-green-600"
                />
              ) : (
                <MdOutlineEdit
                  onClick={() => {
                    setEditingTrackId(track.$id);
                    setEditedNames((prev) => ({
                      ...prev,
                      [track.$id]: track.trackName,
                    }));
                  }}
                  className="text-lg hover:text-purple-600"
                />
              )}
              <RiDeleteBinLine
                className="text-lg hover:text-red-500"
                onClick={() =>
                  handleDelete(track.$id, track.audio, track.video)
                }
              />
            </div>
          </div>
        ))
      )}
    </main>
  );
};

export default TrackHistory;
