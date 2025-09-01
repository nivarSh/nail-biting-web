// InfoPopup.jsx (step 1)
import { useState } from "react";

export default function InfoPopup({ closePopup }) {
  const [selectedIndex, setIndex] = useState(0);

  const cardText = [
    "Please make sure your camera is positioned so that your face and hands are visible.",
    "Make sure the room is well lit for best accuracy.",
    "This detector will be inactive if you leave this tab.",
  ];

  const total = cardText.length;

  const next = () => {
    if (selectedIndex >= total - 1) {
      closePopup();
      return;
    }
    setIndex((p) => p + 1);
  };

  const prev = () => setIndex((p) => Math.max(0, p - 1));

  return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
    >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl dashboard p-6 text-gray-800 shadow-xl">
        <h2 className="text-left text-sm font-medium text-gray-300">Quick setup tips</h2>


        <div className="flex items-center mt-4 gap-2">
            {[...Array(total)].map((_, i) => (
                <span
                key={i}
                className={[
                    "h-2 w-2 rounded-full transition-all",
                    i === selectedIndex ? "bg-green-400 w-4" : "bg-gray-300",
                ].join(" ")}
                aria-hidden
                />
            ))}
            <span className="ml-auto text-xs text-gray-300">
                {selectedIndex + 1}/{total}
            </span>
            </div>


            <p className="mt-2 text-gray-400 leading-relaxed">{cardText[selectedIndex]}</p>

            <div className="mt-4 flex items-center gap-3">
                {selectedIndex !== 0 && (
                <button
                    onClick={prev}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 duration-200 hover:bg-neutral-900"
                >
                    ← Prev
                </button>
                )}

                <div className="ml-auto">
                    {selectedIndex !== total - 1 ? (
                        <button
                        onClick={next}
                        className="rounded-lg bg-green-400 px-4 py-2 text-sm font-semibold text-black duration-200 hover:bg-green-600"
                        >
                        Next →
                        </button>
                    ) : (
                        <button
                        onClick={next}
                        className="rounded-lg bg-green-400 px-4 py-2 text-sm font-semibold text-black duration-200 hover:bg-green-600"
                        >
                        Get started!
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
