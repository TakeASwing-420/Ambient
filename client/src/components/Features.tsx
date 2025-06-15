import { FC } from "react";
import { TbEaseInOutControlPoints } from "react-icons/tb";
import { MdPrivacyTip } from "react-icons/md";
import { LuBrainCircuit } from "react-icons/lu";

const Features: FC = () => {
  return (
    <section className="mt-16 min-h-[70vh] flex flex-col justify-center items-center h-fit">
      <h2 className="purpleTitle font-poppins font-bold text-2xl md:text-4xl text-center mb-2">
        Why Choose LoFify?
      </h2>
      <p className="subText text-center w-[50%] mb-12">
        Our AI-powered tool remixes your videos with rich, mood-matching lofi audio — fast, seamless, and private.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <LuBrainCircuit className="text-2xl "/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Smart Audio Matching
          </h3>
          <p className="subText">
            Our AI intelligently analyzes your video&apos;s tone and generates a custom lofi soundtrack that fits perfectly.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <TbEaseInOutControlPoints className="text-2xl"/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Seamless Integration
          </h3>
          <p className="subText">
            Automatically replaces existing audio or overlays lofi — giving you full creative control over the final vibe.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <MdPrivacyTip className="text-2xl"/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Quick & Hassle-Free
          </h3>
          <p className="subText">
            No installs. No waiting. Upload, transform, and download — all in one streamlined, web-based experience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
