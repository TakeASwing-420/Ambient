import { FC } from "react";
import { TbEaseInOutControlPoints } from "react-icons/tb";
import { MdPrivacyTip } from "react-icons/md";
import { LuBrainCircuit } from "react-icons/lu";

const Features: FC = () => {
  return (
    <section className="mt-[8rem] min-h-[70vh] w-full flex sm:flex-row-reverse flex-col justify-center items-start h-fit relative">
      <div className="flex flex-col justify-start sm:items-start items-center sm:w-1/2 w-full h-fit sm:pl-28 px-4 py-4 sm:sticky top-16">
        <h2 className="purpleTitle font-poppins font-bold text-2xl md:text-4xl sm:text-left text-center mb-2">
          Why Choose LoFify?
        </h2>
        <p className="subText sm:text-left text-center sm:w-[70%] w-[90%]">
          Our AI-powered tool remixes your videos with rich, mood-matching lofi
          audio — fast, seamless, and private.
        </p>
      </div>

      <div className="grid md:grid-cols-1 gap-8 sm:w-[45%] w-[100%]">
        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <LuBrainCircuit className="text-2xl " />
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Smart Audio Matching
          </h3>
          <p className="subText">
            Our AI intelligently analyzes your video&apos;s tone and generates a
            custom lofi soundtrack that fits perfectly.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <TbEaseInOutControlPoints className="text-2xl" />
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Seamless Integration
          </h3>
          <p className="subText">
            Automatically replaces existing audio or overlays lofi — giving you
            full creative control over the final vibe.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <MdPrivacyTip className="text-2xl" />
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Quick & Hassle-Free
          </h3>
          <p className="subText">
            No installs. No waiting. Upload, transform, and download — all in
            one streamlined, web-based experience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
