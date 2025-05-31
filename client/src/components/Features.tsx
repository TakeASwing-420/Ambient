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
      <p className="subText text-center w-[55%] mb-12">
        Our AI-powered technology delivers high-quality lofi transformations
        with extensive customization options.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <LuBrainCircuit className="text-2xl "/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Advanced AI
          </h3>
          <p className="subText">
            Our state-of-the-art AI model transforms any music into authentic
            lofi with exceptional quality.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <TbEaseInOutControlPoints className="text-2xl"/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Full Control
          </h3>
          <p className="subText">
            Fine-tune your lofi transformation with intuitive controls tailored
            to your preferences.
          </p>
        </div>

        <div className="card p-6 shadow-md hover:shadow-lg">
          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4 featureLogo">
            <MdPrivacyTip className="text-2xl"/>
          </div>
          <h3 className="purpleTitle font-poppins font-semibold text-lg mb-2">
            Privacy First
          </h3>
          <p className="subText">
            Your music stays private. We process your tracks securely and never
            store them longer than needed.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
