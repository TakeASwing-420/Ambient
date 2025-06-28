// ShareModal.tsx
import React from 'react';
import { FaWhatsapp, FaTelegramPlane, FaTwitter, FaFacebook, FaLinkedin, FaCopy, FaYoutube } from 'react-icons/fa';

export default function ShareModal({ isOpen, onClose, videoUrl }: { isOpen: boolean, onClose: () => void, videoUrl: string }) {
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const encodedUrl = encodeURIComponent(videoUrl);

  const shareOptions = [
  {
    name: 'WhatsApp',
    icon: <FaWhatsapp className="text-green-500" />,
    url: `https://wa.me/?text=${encodedUrl}`,
  },
  {
    name: 'Telegram',
    icon: <FaTelegramPlane className="text-blue-400" />,
    url: `https://t.me/share/url?url=${encodedUrl}&text=Check this out!`,
  },
  {
    name: 'X / Twitter',
    icon: <FaTwitter className="text-sky-400" />,
    url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=Check+this+lofi+video!`,
  },
  {
    name: 'Facebook',
    icon: <FaFacebook className="text-blue-600" />,
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  },
  {
    name: 'LinkedIn',
    icon: <FaLinkedin className="text-blue-700" />,
    url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  },
  {
    name: 'YouTube',
    icon: <FaYoutube className="text-red-600" />,
    url: `https://www.youtube.com/upload`, //
  },
];

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex justify-center items-center z-50">
      <div className="card p-6 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Share this <span className='purpleTitle'>Video</span></h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            readOnly
            value={videoUrl}
            className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
          />

          <div className="flex justify-center items-center my-2 gap-2 flex-wrap">
          {shareOptions.map((opt) => (
            <a
              key={opt.name}
              href={opt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-opacity-90 text-2xl saturate-0 hover:saturate-100 transition-all duration-200 ease-in-out"
              title={`Share on ${opt.name}`}
            >
              {opt.icon}
              {/* <span className="hidden sm:inline">{opt.name}</span> */}
            </a>
          ))}
        </div>

          <button
            onClick={handleCopy}
            className="darkBtn px-4 py-2 rounded-lg transition flex justify-center items-center gap-2"
          >
            Copy Link
            <FaCopy />
          </button>
          <button
            onClick={onClose}
            className="lightBtn rounded-lg py-2 mt-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}