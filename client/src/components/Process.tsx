import { FC } from "react";
import { FaVideo } from "react-icons/fa6";
import { BsSliders2Vertical } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";

const Process: FC = () => {
  return (
    <section className="mt-16 min-h-[70vh] flex flex-col justify-center items-center h-fit">
      <h2 className="purpleTitle font-poppins font-bold text-2xl md:text-4xl text-center mb-2">
        How It Works
      </h2>
      <p className="subText text-center w-[65%] mb-12">
        From upload to AI-generated lofi vibes in just three simple steps.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <FaVideo className="text-3xl purpleTitle"/>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Upload Video
          </h3>
          <p className="subText text-center">
            Select and upload your video — we support all common formats for
            quick and seamless processing.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <BsSliders2Vertical className="text-3xl" />
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            AI Generates Lofi Audio
          </h3>
          <p className="subText text-center">
            Our AI analyzes the video&apos;s mood and crafts a unique lofi beat that fits the vibe.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <FiDownload className="text-3xl purpleTitle"/>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Preview & Download
          </h3>
          <p className="subText text-center">
            Instantly preview your enhanced video or download the remixed version or standalone lofi audio track.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Process;
