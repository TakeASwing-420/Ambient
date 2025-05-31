import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import { GeneratedAudio, LofiParameters, AudioFile } from "@/types";
import WorkflowContainer from "@/components/WorkflowContainer";
import UploadZone from "@/components/UploadZone";
import ParameterControls from "@/components/ParameterControls";

const Convert: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const generatedAudio: GeneratedAudio = {
    id: "audio-001",
    url: "https://example.com/audio.mp3",
    filename: "lofi-track.mp3",
    duration: "3:21",
  };

  const parameters: LofiParameters = {
    // tempo: 80,
    // reverb: true,
    // distortion: false,
    chillLevel: 5,
    beatIntensity: 3,
    vintageEffect: 50,
    mood: "relaxed",
  };

  const handleRegenerate = () => {
    console.log("Regenerate audio");
  };

  const handleDownload = () => {
    console.log("Download audio");
  };

  const handleStartOver = () => {
    console.log("Start over");
  };

  const [parameter, setParameter] = useState<LofiParameters>({
    chillLevel: 50,
    beatIntensity: 60,
    vintageEffect: 30,
    mood: "relaxed",
  });

  const [audioFile, setAudioFile] = useState<AudioFile>({
    name: "lofi-track.mp3",
    file: new File([], "lofi-track.mp3"),
    duration: "3:20",
    size: "0",
    url: "",
  });

  const handleParameterChange = (param: keyof LofiParameters, value: any) => {
    setParameter((prev) => ({ ...prev, [param]: value }));
  };

  const handleRemoveFile = () => {
    console.log("File removed");
    // Set to null or show a file uploader again
  };

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-4 bg-purple-50 min-h-screen h-fit convert">
        {/* Hero */}
        <section className="pb-12 flex flex-col justify-center items-center h-fit">
          <div className="w-full p-1 flex justify-center items-center text-left mb-12">
            <h2 className="font-poppins font-bold text-2xl md:text-4xl">
              Convert Your Music into&nbsp;
            <span className="font-poppins w-fit font-bold text-2xl md:text-4xl purpleTitle">
              LoFi
            </span>
            </h2>
          </div>

          <div className="w-full flex md:flex-row flex-col md:h-[74vh] h-fit mb-16">
            <div className="md:w-1/2 w-full p-2 h-full">
              <WorkflowContainer />
            </div>

            <div className="md:w-1/2 w-full p-2">
              <ParameterControls
                parameters={parameter}
                audioFile={audioFile}
                onParameterChange={handleParameterChange}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          </div>

          <div className="w-full flex h-full p-2">
            <AudioPlayer
              generatedAudio={generatedAudio}
              originalFileName="song.mp3"
              parameters={parameters}
              onRegenerate={handleRegenerate}
              onDownload={handleDownload}
              onStartOver={handleStartOver}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Convert;
