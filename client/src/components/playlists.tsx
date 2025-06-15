import React from "react";
import { useEffect } from "react";
import { FC } from "react";
import { IoMdAdd } from "react-icons/io";
import { FaMusic } from "react-icons/fa";
import { CiPlay1 } from "react-icons/ci";
import { BsThreeDots } from "react-icons/bs";

const Playlists: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const playlists = [
    {
      id: 1,
      title: "Chill Study Beats",
      totalTracks: 12,
      totalDuration: 45,
    },
    {
      id: 2,
      title: "Relaxed Mind",
      totalTracks: 19,
      totalDuration: 56,
    },
    {
      id: 3,
      title: "Study Focus",
      totalTracks: 4,
      totalDuration: 15,
    },
    {
      id: 4,
      title: "Lofi Mood",
      totalTracks: 10,
      totalDuration: 38,
    },
    {
      id: 5,
      title: "Long Walks",
      totalTracks: 25,
      totalDuration: 63,
    },
  ];

  return (
    <>
      <main className="w-full flex flex-col gap-4 justify-center items-center">
        <div className="w-full px-4 py-2 flex justify-between items-center">
          <h1 className="font-semibold text-2xl">Your Playlists</h1>

          <div className="flex justify-center items-center gap-2 text-sm">
            <button className="flex justify-center items-center gap-2 text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200 ease-in-out darkBtn">
              <IoMdAdd /> New Playlist
            </button>
          </div>
        </div>

        <div className="flex flex-wrap md:justify-normal justify-center md:gap-4 gap-8 w-full h-fit">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="h-[300px] md:w-[32.4%] w-[95%] rounded-lg bg-white shadow-lg border flex flex-col justify-between overflow-hidden playlist"
            >
              <div className="h-1/2 bg-gradient-to-br from-purple-900 via-purple-600 via-fuchsia-500 to-pink-400 flex justify-center items-center text-4xl">
                <FaMusic className="text-white/50" />
              </div>

              <div className="p-3">
                <div className="flex justify-between mb-6 items-center">
                  <h1 className="text-lg">{playlist.title}</h1>
                  <BsThreeDots />
                </div>
                <p className="subText text-sm mb-2">
                  {playlist.totalTracks} tracks • {playlist.totalDuration} min
                </p>
                <button className="w-full flex justify-center items-center gap-2 bg-purple-500 rounded-lg py-2 text-white hover:bg-purple-600 darkBtn">
                  <CiPlay1 /> Play
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Playlists;
