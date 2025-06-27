import { FC } from "react";
import { Link } from "wouter";

const CTA: FC = () => {
  return (
    <section className="mt-16 py-12 flex flex-col justify-center items-center h-fit card">
      <h2 className="font-poppins font-bold text-xl md:text-3xl mb-5">
        Ready to vibe your <span className="purpleTitle">Videos?</span>
      </h2>
      <Link href="/Convert">
        <button className="darkBtn rounded-md md:text-[0.925rem] text-xs px-5 py-2">
          Upload and Lofi-Fy
        </button>
      </Link>
    </section>
  );
};

export default CTA;
