import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { appwriteDatabases, account, storage, Query } from "../storage/appwriteConfig";
import { ID } from "appwrite";
import { MdOutlineDone, MdOutlineEdit } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import { BsShieldLockFill } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { BsCalendar2DateFill } from "react-icons/bs";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);

  useEffect(() => {
    const getUserAndDocs = async () => {
      try {
        const userData = await account.get();

        if (userData.prefs?.profilePic) {
          const preview = storage.getFileView(
            import.meta.env.VITE_APPWRITE_BUCKET_ID,
            userData.prefs.profilePic
          ).href;
          userData.prefs.profilePic = preview;
        }

        setUser(userData);

        const response = await appwriteDatabases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
          [Query.equal("clientID", userData.$id)]
        );
        setDocs(response.documents);

        const response2 = await appwriteDatabases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PLAYLIST_COLLECTION_ID,
          [Query.equal("clientID", userData.$id)]
        );
        setPlaylists(response2.documents);
      } catch (error) {
        console.error("Error fetching profile or tracks:", error);
      }
    };

    getUserAndDocs();
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}m ${parseFloat(secs) < 10 ? "0" : ""}${secs}s`;
  };

  const totalDuration = docs.reduce((sum, doc) => {
    return sum + (typeof doc.duration === "number" ? doc.duration : 0);
  }, 0);

  const generateUserTitle = (totalTracks, totalDurationInSeconds) => {
    const totalMinutes = totalDurationInSeconds / 60;

    if (totalTracks === 0 || totalDurationInSeconds === 0)
      return "Silent Listener 🌑";
    if (totalTracks <= 5 && totalMinutes <= 1) return "Lo-Fi Newbie";
    if (totalTracks <= 15 && totalMinutes <= 3) return "Casual Viber";
    if (totalTracks <= 30 && totalMinutes <= 6) return "Chill Explorer";
    if (totalTracks <= 50 && totalMinutes <= 10) return "Beat Nomad";
    if (totalTracks <= 100 && totalMinutes <= 20) return "Lo-Fi Enthusiast";
    if (totalTracks <= 150 && totalMinutes <= 30) return "Mood Curator";
    if (totalTracks <= 250 && totalMinutes <= 50) return "Vibe Architect";
    if (totalTracks > 250 && totalMinutes <= 100) return "Sound Sage";
    if (totalTracks > 300 && totalMinutes > 100) return "Lo-Fi Legend";
    return "Frequency Wanderer 🌊";
  };

  const handleSaveUsername = async () => {
    if (!user || (!newUsername && !profilePicFile)) {
      setIsEditing(false);
      return;
    }

    let profilePicId = user?.prefs?.profilePic;

    if (profilePicFile) {
      try {
        const uploaded = await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          ID.unique(),
          profilePicFile
        );
        profilePicId = uploaded.$id;
      } catch (err) {
        console.error("Profile picture upload failed:", err);
      }
    }

    try {
      await account.updatePrefs({
        username: newUsername || user?.prefs?.username,
        profilePic: profilePicId,
      });

      const updatedUser = await account.get();

      // Fetch preview if pic uploaded
      if (updatedUser.prefs?.profilePic) {
        const preview = storage.getFileView(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          updatedUser.prefs.profilePic
        ).href;
        updatedUser.prefs.profilePic = preview;
      }

      setUser(updatedUser);
      setIsEditing(false);
      setProfilePicFile(null);
      console.log("Profile updated successfully!");
      toast({
              title: "Profile Updated",
              description: "Profile updated Successfully!",
            });
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  return (
    <div>
      <Header />
      {!user ? (
        <p>Loading Profile...</p>
      ) : (
        <div className="h-fit max-w-7xl mx-auto py-10 flex flex-col justify-start items-center mt-28 gap-4 home">
          <div className="h-36 w-36 bg-gray-400 text-black rounded-full flex justify-center items-center border-[3px] border-purple-600 overflow-hidden">
            {user?.prefs?.profilePic && !profilePicFile ? (
              <img
                src={user.prefs.profilePic}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center">
                <h2 className="font-poppins font-bold text-4xl">
                  {user.name?.[0] ?? "U"}
                </h2>
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 text-xs text-white"
                    onChange={(e) => setProfilePicFile(e.target.files[0])}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 p-4 w-full justify-center items-center">
            <h1 className="text-4xl font-semibold flex justify-center items-center flex-col">
              {user.name ?? "N/A"}
              <span className="text-base px-2 py-1 mt-4 font-thin rounded-lg text-purple-400 bg-purple-800/20 hover:bg-purple-700/30 transition-all duration-200 ease-in-out cursor-pointer">
                {generateUserTitle(docs.length, totalDuration)}
              </span>
            </h1>

            <div className="flex flex-col mt-4 gap-2">
              <p className="subText flex justify-start items-center gap-2 text-lg">
                <span className="text-sm flex justify-center items-center gap-1">
                  <FaUser /> Username:
                </span>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="ml-2 px-2 py-1 rounded-md bg-transparent border-b border-purple-500 text-white proInput"
                  />
                ) : (
                  <span>{user?.prefs?.username ?? user.$id}</span>
                )}
              </p>
              <p className="subText flex justify-start items-center gap-2 text-lg">
                <span className="text-sm flex justify-center items-center gap-1">
                  <MdEmail /> Email:
                </span>{" "}
                {user.email ?? "N/A"}
              </p>
              <p className="subText flex justify-start items-center gap-2 text-lg">
                <span className="text-sm flex justify-center items-center gap-1">
                  <BsCalendar2DateFill />
                  Joined on:
                </span>{" "}
                {user.$createdAt
                  ? new Date(user.$createdAt).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="w-full flex justify-between px-10">
            <div className="bg-violet-800/30 w-[32%] h-[150px] rounded-xl px-5 py-2">
              <h2 className="text-purple-500">Tracks Converted</h2>
              <p className="w-full flex justify-center mt-8 text-3xl font-bold">
                {docs?.length ?? 0}
              </p>
            </div>

            <div className="bg-violet-800/30 w-[32%] h-[150px] rounded-xl px-5 py-2">
              <h2 className="text-purple-500">Total Duration</h2>
              <p className="w-full flex justify-center mt-8 text-3xl font-bold">
                {docs.length > 0 ? formatDuration(totalDuration) : "0m 00s"}
              </p>
            </div>

            <div className="bg-violet-800/30 w-[32%] h-[150px] rounded-xl px-5 py-2">
              <h2 className="text-purple-500">Playlists</h2>
              <p className="w-full flex justify-center mt-8 text-3xl font-bold">
                {playlists.length}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              className="darkBtn px-3 py-2 rounded-lg flex gap-1 justify-center items-center"
              onClick={() => {
                if (isEditing) {
                  handleSaveUsername();
                } else {
                  setNewUsername(user?.prefs?.username || "");
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <>
                  Save <MdOutlineDone className="text-lg" />
                </>
              ) : (
                <>
                  Edit Profile <MdOutlineEdit className="text-lg" />
                </>
              )}
            </button>
            <button className="darkBtn px-3 py-2 rounded-lg flex gap-1 justify-center items-center">
              Change Password <BsShieldLockFill className="text-lg" />
            </button>
            <button className="bg-red-600/60 hover:bg-red-600/80 transition-all duration-200 ease-in-out px-3 py-2 rounded-lg flex gap-1 justify-center items-center">
              Delete Account <RiDeleteBinLine className="text-lg" />
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Profile;