import { FC } from "react";
import { FaMusic } from "react-icons/fa";
import { BsSliders2Vertical } from "react-icons/bs";
import { RiPlayListLine } from "react-icons/ri";

const Process: FC = () => {
  return (
    <section className="mt-16 min-h-[70vh] flex flex-col justify-center items-center h-fit">
      <h2 className="purpleTitle font-poppins font-bold text-2xl md:text-4xl text-center mb-2">
        How It Works
      </h2>
      <p className="subText text-center w-[65%] mb-12">
        Upload any music file or provide a link to convert it to lofi.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <FaMusic className="text-3xl purpleTitle"/>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Upload Music
          </h3>
          <p className="subText text-center">
            Upload any music file or provide a link to convert it to lofi.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <BsSliders2Vertical className="text-3xl"/>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Customise Parameters
          </h3>
          <p className="subText text-center">
            Adjust tempo, reverb, filters, and more to get your perfect lofi sound.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <RiPlayListLine className="text-3xl purpleTitle"/>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Create Playlists
          </h3>
          <p className="subText text-center">
            Save your converted tracks and organize them into custom playlists.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Process;