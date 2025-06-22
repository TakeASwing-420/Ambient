import React from "react";
import { useEffect } from "react";
import { FC } from "react";
import { IoPlayOutline } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { FiDownload } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoShareSocial } from "react-icons/io5";

const TrackHistory: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tracks = [
    {
      id: 1,
      title: "Summer Vibes",
      originalFile: "summer_track.mp3",
      convertedDate: "2023-05-10",
      duration: "3:42"
    },
    {
      id: 2,
      title: "Chill Evening",
      originalFile: "chill_evening.mp3",
      convertedDate: "2023-05-15",
      duration: "4:12"
    },
    {
      id: 3,
      title: "Morning Coffee",
      originalFile: "morning_coffee.wav",
      convertedDate: "2023-05-20",
      duration: "2:55"
    },
    {
      id: 4,
      title: "Midnight Drive",
      originalFile: "midnight_drive.mp3",
      convertedDate: "2023-05-22",
      duration: "5:18"
    },
    {
      id: 5,
      title: "Relaxing Rain",
      originalFile: "relaxing_rain.wav",
      convertedDate: "2023-05-25",
      duration: "6:30"
    },
    {
      id: 6,
      title: "Urban Beats",
      originalFile: "urban_beats.mp3",
      convertedDate: "2023-05-28",
      duration: "3:25"
    },
    {
      id: 7,
      title: "Forest Ambience",
      originalFile: "forest_sounds.mp3",
      convertedDate: "2023-06-01",
      duration: "7:15"
    },
    {
      id: 8,
      title: "Lo-Fi Study",
      originalFile: "lofi_study.wav",
      convertedDate: "2023-06-05",
      duration: "4:45"
    },
    {
      id: 9,
      title: "Ocean Waves",
      originalFile: "ocean_waves.mp3",
      convertedDate: "2023-06-10",
      duration: "5:50"
    },
    {
      id: 10,
      title: "Acoustic Session",
      originalFile: "acoustic_session.mp3",
      convertedDate: "2023-06-15",
      duration: "4:20"
    }
  ];

  return (
    <>
      <main className="w-full flex flex-col gap-4 justify-center items-center">
        <div className="w-full px-4 py-2 flex md:flex-row flex-col justify-between items-center">
            <h1 className="font-semibold md:text-2xl text-xl md:my-0 my-6">Your Conversion History</h1>

            <div className="flex justify-center items-center gap-2 text-sm">
                <p className="text-sm subText">Sort by:</p>
                <select name="sort" id="sort" className="p-2 rounded-lg border shadow-md sort">
                    <option value="Date">Date (Newest)</option>
                    <option value="Title">Title (A-Z)</option>
                    <option value="Duration">Duration</option>
                </select>
            </div>
        </div>

        {/* Tracks Display */}
        {tracks.map((track) => (
          <div key={track.id} className="bg-white w-full shadow-lg p-5 flex md:flex-row flex-col md:gap-0 gap-4 md:justify-between justify-center items-center trackCard">
            <div className="flex justify-center items-center gap-3">
              {/* Play Icon */}
              <div className="bg-purple-200 w-fit h-fit p-3 text-lg rounded-full flex justify-center items-center hover:bg-purple-300 transition-all duration-200 ease-in-out playBtn">
                <IoPlayOutline />
              </div>

              {/* Track Info */}
              <div>
                <h1 className="font-semibold text-lg">{track.title}</h1>
                <p className="text-xs subText">
                  Original: {track.originalFile} • Converted: {track.convertedDate}
                </p>
              </div>
            </div>

            {/* Other Info - Duration, Download, Add, Delete */}
            <div className="flex gap-6 justify-center items-center">
              <p className="text-sm subText">{track.duration}</p>
              <IoMdAdd className="text-lg hover:text-purple-600 transition-all duration-200 ease-in-out"/>
              <FiDownload className="text-lg hover:text-purple-600 transition-all duration-200 ease-in-out"/>
              <RiDeleteBinLine className="text-lg hover:text-purple-600 transition-all duration-200 ease-in-out"/>
              <IoShareSocial className="text-lg hover:text-purple-600 transition-all duration-200 ease-in-out"/>
            </div>
          </div>
        ))}
      </main>
    </>
  );
};

export default TrackHistory;
