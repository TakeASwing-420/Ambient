import React from "react";
import { useEffect, useState } from "react";
import { FC } from "react";
import { IoMdAdd } from "react-icons/io";
import { FaMusic } from "react-icons/fa";
import { CiPlay1 } from "react-icons/ci";
import { RiDeleteBinLine } from "react-icons/ri";
import { MdOutlineDone, MdOutlineEdit } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "@/hooks/use-toast";
import {
  appwriteDatabases,
  client,
  Query,
  ID,
  account,
} from "../storage/appwriteConfig";
import PlaylistTracks from "./PlaylistTracks";

const Playlists: FC = () => {
  const [playlists, setPlaylists] = useState([]);
  const [show, setShow] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistShow, setPlaylistShow] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    try {
      const user = await account.get();
      const response = await appwriteDatabases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        [Query.equal("clientID", user.$id)]
      );
      return response.documents;
    } catch (err) {
      console.error("Error fetching data:", err);
      return [];
    }
  };

  useEffect(() => {
    const getData = async () => {
      const data = await fetchData();
      setPlaylists(data);
    };
    getData();
  }, []);

  const deletePlaylist = async (playlistId: string) => {
    try {
      await appwriteDatabases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId
      );

      setPlaylists((prev) => prev.filter((pl) => pl.$id !== playlistId));
      toast({
        title: "Playlist Deleted",
        description: "This Lofi playlist have been deleted.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      toast({
        title: "Deletion Failed",
        description: "Try again to delete this playlist!",
        variant: "destructive",
      });
    }
  };

  const createPlaylist = async (playlistName: string) => {
    if (!playlistName.trim()) {
      alert("Playlist name cannot be empty.");
      return;
    }

    try {
      const user = await account.get();

      const existingPlaylists = await appwriteDatabases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        [Query.equal("clientID", user.$id)]
      );

      const nameExists = existingPlaylists.documents.some(
        (pl) =>
          pl.name.trim().toLowerCase() === playlistName.trim().toLowerCase()
      );

      if (nameExists) {
        toast({
          title: "Playlist Name Exists",
          description: "LoFi playlist with this name already exists!",
          variant: "destructive",
        });
        return;
      }

      const newPlaylist = await appwriteDatabases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        ID.unique(),
        {
          name: playlistName,
          clientID: user.$id,
          initTracks: [],
        }
      );

      toast({
        title: "Playlist Created",
        description: "Your LoFi playlist have been created successfully!",
      });
      return newPlaylist;
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Playlist Error!",
        description: "Failed to create playlist. Please try again!",
        variant: "destructive",
      });
    } finally {
      setShow(false);
    }
  };

  const handleCreate = async () => {
    const newPlaylist = await createPlaylist(playlistName);
    if (newPlaylist) {
      setPlaylists((prev) => [newPlaylist, ...prev]);
      setPlaylistName("");
    }
  };

  const updatePlaylistName = async (playlistId: string) => {
    if (!newName.trim()) {
      toast({
        title: "Playlist Name Error!",
        description: "Playlist name cannot be empty!",
        variant: "destructive",
      });
      return;
    }

    try {
      await appwriteDatabases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
        playlistId,
        { name: newName.trim() }
      );

      setPlaylists((prev) =>
        prev.map((pl) =>
          pl.$id === playlistId ? { ...pl, name: newName.trim() } : pl
        )
      );

      toast({
        title: "Playlist Name Changed",
        description: "Name Changed Successfullly!",
      });

      setEditingId(null);
      setNewName("");
    } catch (error) {
      console.error("Error updating playlist name:", error);
      toast({
        title: "Playlist Name Error!",
        description: "Failed to update playlist name. Please try again!",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <main className="w-full flex flex-col gap-4 justify-center items-center">
        {selectedPlaylistId === null && (
          <>
            <div className="w-full px-4 py-2 flex justify-between items-center relative">
              <h1 className="font-semibold text-2xl">Your Playlists</h1>

              {show && (
                // <div className="rounded-lg flex flex-col p-8 backdrop-blur-lg flowing-gradient2 fixed top-[30%] left-[38%]">
                <div className="rounded-lg flex flex-col p-8 backdrop-blur-lg bg-[#1a1a2e84] fixed top-[30%] left-[38%]">
                  <IoCloseOutline
                    className="text-gray-400 hover:text-white transition-all duration-200 ease-in-out text-xl absolute top-3 right-2"
                    onClick={() => {
                      setShow(false);
                    }}
                  />
                  <h2 className="text-2xl font-poppins font-bold mb-4">
                    Create New <span className="purpleTitle">LoFi</span>{" "}
                    Playlist
                  </h2>
                  <label htmlFor="name" className="mb-1 text-base font-thin">
                    Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Enter Playlist Name..."
                    className="px-3 py-1 bg-transparent subText rounded-lg text-sm pl-1"
                  />
                  <div className="w-full flex justify-center">
                    <button
                      className="mt-5 darkBtn w-fit px-4 py-1 rounded-lg"
                      onClick={handleCreate}
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center items-center gap-2 text-sm">
                <button
                  className="flex justify-center items-center gap-2 text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200 ease-in-out darkBtn"
                  onClick={() => {
                    setShow(true);
                  }}
                >
                  <IoMdAdd /> New Playlist
                </button>
              </div>
            </div>

            <div className="flex flex-wrap md:justify-normal justify-center md:gap-4 gap-8 w-full h-fit">
              {playlists.map((playlist) => (
                <div
                  key={playlist.$id}
                  className="h-[300px] md:w-[32.4%] w-[95%] rounded-lg bg-white shadow-lg border flex flex-col justify-between overflow-hidden playlist"
                >
                  {/* <div className="h-1/2 bg-gradient-to-br from-purple-900 via-purple-600 via-fuchsia-500 to-pink-400 flex justify-center items-center text-4xl"> */}
                  <div className="h-1/2 bg-gradient-to-br overflow-hidden flowing-gradient flex justify-center items-center text-4xl">
                    <FaMusic className="text-white/50" />
                  </div>

                  <div className="p-3">
                    <div className="flex justify-between mb-6 items-center">
                      {editingId === playlist.$id ? (
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            updatePlaylistName(playlist.$id)
                          }
                          className="border px-2 py-1 text-sm rounded-md"
                          autoFocus
                        />
                      ) : (
                        <h1 className="text-lg font-semibold truncate">
                          {playlist.name}
                        </h1>
                      )}
                      <div className="flex gap-2">
                        {editingId === playlist.$id ? (
                          <MdOutlineDone
                            className="text-lg text-green-600 cursor-pointer hover:text-green-800"
                            onClick={() => updatePlaylistName(playlist.$id)}
                            title="Save changes"
                          />
                        ) : (
                          <MdOutlineEdit
                            className="text-lg cursor-pointer hover:text-purple-600 opacity-50 hover:opacity-80"
                            onClick={() => {
                              setEditingId(playlist.$id);
                              setNewName(playlist.name);
                            }}
                            title="Edit playlist name"
                          />
                        )}
                        <RiDeleteBinLine
                          className="text-lg hover:text-red-500 opacity-50 hover:opacity-80"
                          onClick={() => {
                            deletePlaylist(playlist.$id);
                          }}
                        />
                      </div>
                    </div>
                    <p className="subText text-sm mb-2">
                      {playlist.initTracks.length === 1
                        ? playlist.initTracks.length + " track"
                        : playlist.initTracks.length + " tracks"}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPlaylistId(playlist.$id);
                      }}
                      className="w-full flex justify-center items-center gap-2 bg-purple-500 rounded-lg py-2 text-white hover:bg-purple-600 darkBtn"
                    >
                      <CiPlay1 /> Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedPlaylistId && (
          <PlaylistTracks playlistId={selectedPlaylistId} onBack={() => setSelectedPlaylistId(null)} />
        )}

        {/* const [playlists, setPlaylists] = useState([]);
        const [show, setShow] = useState(false); */}
      </main>
    </>
  );
};

export default Playlists;