import React, { useState } from "react";
import { useEffect } from "react";
import { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackHistory from "@/components/trackHistory";
import Playlists from "@/components/playlists";

const Dashboard: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

const [display, setDisplay] = useState("trackHistory");

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-4 bg-purple-50 min-h-screen h-fit dashboard">
        {/* Hero */}
        <section className="pb-4 flex flex-col justify-center items-center h-fit">
          <div className="w-full p-1 flex justify-center items-center text-left">
            <h2 className="font-poppins font-bold text-2xl md:text-4xl">Your <span className="purpleTitle">LoFi</span> Tracks</h2>
          </div>

          <div className="mt-12 mb-2 p-[0.1rem] rounded-lg flex md:flex-row flex-col gap-1 justify-center items-center border bg-gray-200 option">
            <button className={`subText optionEach hover:bg-white/40 rounded-l-lg ${display === "trackHistory" ? "activeBtn" : ""} w-[200px]`} onClick={() => setDisplay("trackHistory")}>Conversion History</button>
            <button className={`subText optionEach hover:bg-white/40 rounded-r-lg ${display === "playlist" ? "activeBtn" : ""} w-[200px]`} onClick={() => setDisplay("playlist")}>Playlists</button>
          </div>
        </section>

        <section>
          {display === "trackHistory" ? <TrackHistory/> : <Playlists/>}
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Dashboard;
