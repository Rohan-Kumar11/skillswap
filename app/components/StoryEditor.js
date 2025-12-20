"use client";
// app/components/StoryEditor.js
import { useRef, useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { useDialog } from "../components/CustomDialog";

/**
 * Story Editor - Instagram-style cropping with pinch zoom and pan
 */
export default function StoryEditor({ media, type, onCancel, onSave }) {
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const imageRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const cropImageRef = useRef(null);
  const panStartRef = useRef(null);

  const [elements, setElements] = useState([]);
  const [activeElement, setActiveElement] = useState(null);
  const [activeTab, setActiveTab] = useState("stickers");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [musicFile, setMusicFile] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicStartTime, setMusicStartTime] = useState(0);
  
  // Instagram-style crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [originalMedia, setOriginalMedia] = useState(media);
  const [croppedMedia, setCroppedMedia] = useState(null);

  const toast = useToast();
  const { showPrompt, showConfirm, DialogComponent } = useDialog();

  // Built-in music library
  const musicLibrary = [
    { id: 1, name: "Summer Vibes", emoji: "🌞", url: null },
    { id: 2, name: "Chill Beats", emoji: "🎵", url: null },
    { id: 3, name: "Party Time", emoji: "🎉", url: null },
    { id: 4, name: "Romantic", emoji: "💕", url: null },
    { id: 5, name: "Upbeat", emoji: "⚡", url: null },
    { id: 6, name: "Calm", emoji: "🌙", url: null },
  ];

  // Filters list
  const filters = [
    { name: "none", label: "Original", filter: "" },
    { name: "grayscale", label: "B&W", filter: "grayscale(100%)" },
    { name: "sepia", label: "Sepia", filter: "sepia(100%)" },
    { name: "warm", label: "Warm", filter: "brightness(1.1) saturate(1.3) hue-rotate(-10deg)" },
    { name: "cool", label: "Cool", filter: "brightness(1.1) saturate(1.2) hue-rotate(10deg)" },
    { name: "vintage", label: "Vintage", filter: "sepia(50%) contrast(1.2) brightness(0.9)" },
    { name: "vibrant", label: "Vibrant", filter: "saturate(1.8) contrast(1.1)" },
    { name: "dramatic", label: "Dramatic", filter: "contrast(1.5) brightness(0.9) saturate(1.2)" },
    { name: "fade", label: "Fade", filter: "brightness(1.1) contrast(0.85) saturate(0.8)" },
    { name: "sunset", label: "Sunset", filter: "brightness(1.05) saturate(1.4) hue-rotate(-20deg)" },
  ];

  // Play/pause music
  useEffect(() => {
    if (audioRef.current && musicFile?.dataUrl) {
      audioRef.current.src = musicFile.dataUrl;
      audioRef.current.currentTime = musicStartTime;
      if (musicPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicPlaying, musicFile, musicStartTime]);

  const addText = () => {
    const id = Date.now();
    setElements((prev) => [
      ...prev,
      {
        id,
        type: "text",
        content: "Tap to edit",
        x: 170,
        y: 300,
        scale: 1,
        rotate: 0,
        color: "#ffffff",
        fontSize: 32,
      },
    ]);
    setActiveElement(id);
    toast.success("Text added! Double-click to edit ✏️");
  };

  const addSticker = (emoji) => {
    const id = Date.now();
    setElements((prev) => [
      ...prev,
      {
        id,
        type: "sticker",
        content: emoji,
        x: 170,
        y: 300,
        scale: 1,
        rotate: 0,
      },
    ]);
    setActiveElement(id);
    toast.success(`Sticker ${emoji} added!`);
  };

  const startDrag = (e, el) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveElement(el.id);

    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startElX = el.x;
    const startElY = el.y;

    dragRef.current = { startX, startY, startElX, startElY, elId: el.id };

    const handleMove = (moveEvent) => {
      if (!dragRef.current) return;

      const clientX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;
      const clientY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;

      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;

      setElements((prev) =>
        prev.map((item) =>
          item.id === dragRef.current.elId
            ? {
                ...item,
                x: dragRef.current.startElX + dx,
                y: dragRef.current.startElY + dy,
              }
            : item
        )
      );
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  };

  // Instagram-style pan in crop mode
  const startCropPan = (e) => {
    e.preventDefault();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    panStartRef.current = {
      x: clientX,
      y: clientY,
      startPos: { ...cropPosition }
    };

    const handleMove = (moveEvent) => {
      if (!panStartRef.current) return;

      const clientX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;
      const clientY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;

      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;

      setCropPosition({
        x: panStartRef.current.startPos.x + dx,
        y: panStartRef.current.startPos.y + dy,
      });
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      panStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  };

  const handleCropZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setCropZoom(newZoom);
  };

  const startCropMode = () => {
    setCropMode(true);
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
    toast.info("Crop mode activated! Drag to reposition, slide to zoom 📐");
  };

  const applyCrop = async () => {
    if (type !== "image") return;

    try {
      const img = new Image();
      img.src = originalMedia;

      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Story dimensions
          const storyWidth = 1080;
          const storyHeight = 1920;

          canvas.width = storyWidth;
          canvas.height = storyHeight;

          // Fill with black background
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, storyWidth, storyHeight);

          // Preview container dimensions
          const previewWidth = 340;
          const previewHeight = 604;

          // Calculate how the image fits in the preview at 100% width
          const imgAspect = img.width / img.height;
          const previewAspect = previewWidth / previewHeight;

          let displayWidth, displayHeight;
          if (imgAspect > previewAspect) {
            displayWidth = previewWidth;
            displayHeight = previewWidth / imgAspect;
          } else {
            displayHeight = previewHeight;
            displayWidth = previewHeight * imgAspect;
          }

          // Calculate the scale from preview to output
          const outputScale = storyWidth / previewWidth;

          // Calculate source dimensions with zoom applied
          const sourceWidth = (displayWidth * cropZoom) * outputScale;
          const sourceHeight = (displayHeight * cropZoom) * outputScale;

          // Calculate center position
          const centerX = storyWidth / 2;
          const centerY = storyHeight / 2;

          // Apply the position offset (scaled to output)
          const offsetX = cropPosition.x * outputScale;
          const offsetY = cropPosition.y * outputScale;

          // Calculate final draw position
          const drawX = centerX - (sourceWidth / 2) + offsetX;
          const drawY = centerY - (sourceHeight / 2) + offsetY;

          // Draw the image
          ctx.drawImage(img, drawX, drawY, sourceWidth, sourceHeight);

          const cropped = canvas.toDataURL('image/jpeg', 0.9);
          setCroppedMedia(cropped);
          setCropMode(false);
          toast.success("Crop applied! ✂️");
          resolve();
        };
      });
    } catch (error) {
      toast.error("Failed to apply crop");
      console.error("Crop error:", error);
    }
  };

  const resetCrop = () => {
    setCroppedMedia(null);
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
    setCropMode(false);
    toast.info("Crop reset to original");
  };

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setActiveElement(null);
    toast.success("Element deleted 🗑️");
  };

  const editText = async (id) => {
    const element = elements.find((el) => el.id === id);
    const newText = await showPrompt(
      "Edit Text", 
      "Enter your text:", 
      element?.content || "",
      "Type here..."
    );
    if (newText !== null && newText.trim()) {
      updateElement(id, { content: newText });
      toast.success("Text updated! ✏️", 2000);
    }
  };

  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setMusicFile({
        name: file.name,
        dataUrl: ev.target.result,
      });
      setMusicStartTime(0);
      setMusicPlaying(true);
      toast.success(`Music added: ${file.name} 🎵`);
    };
    reader.onerror = () => toast.error("Failed to read music file");
    reader.readAsDataURL(file);
  };

  const selectLibraryMusic = (track) => {
    toast.info(`"${track.name}" selected! (Demo music - not available yet)`);
  };

  const handleStartTimeChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setMusicStartTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;

    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const currentMedia = croppedMedia || originalMedia;

      if (type === "image") {
        const img = new Image();
        img.src = currentMedia;

        await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            if (selectedFilter !== "none") {
              const filterStyle = filters.find(f => f.name === selectedFilter)?.filter || "";
              ctx.filter = filterStyle;
            }

            ctx.drawImage(img, 0, 0, img.width, img.height);
            ctx.filter = "none";

            const editorWidth = 340;
            const editorHeight = 600;
            const scaleX = img.width / editorWidth;
            const scaleY = img.height / editorHeight;

            elements.forEach((el) => {
              ctx.save();
              ctx.translate(el.x * scaleX, el.y * scaleY);
              ctx.rotate((el.rotate * Math.PI) / 180);
              ctx.scale(el.scale, el.scale);

              if (el.type === "text") {
                ctx.fillStyle = el.color;
                ctx.font = `bold ${el.fontSize * scaleX}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(el.content, 0, 0);
              } else if (el.type === "sticker") {
                ctx.font = `${60 * scaleX}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(el.content, 0, 0);
              }

              ctx.restore();
            });

            resolve();
          };
          img.onerror = reject;
        });
      } else {
        canvas.width = 340;
        canvas.height = 600;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 340, 600);

        elements.forEach((el) => {
          ctx.save();
          ctx.translate(el.x, el.y);
          ctx.rotate((el.rotate * Math.PI) / 180);
          ctx.scale(el.scale, el.scale);

          if (el.type === "text") {
            ctx.fillStyle = el.color;
            ctx.font = `bold ${el.fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(el.content, 0, 0);
          } else if (el.type === "sticker") {
            ctx.font = "60px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(el.content, 0, 0);
          }

          ctx.restore();
        });
      }

      const imageDataUrl = canvas.toDataURL("image/png");
      const meta = musicFile ? { 
        music: { 
          dataUrl: musicFile.dataUrl, 
          startMs: musicStartTime * 1000,
          name: musicFile.name 
        } 
      } : null;
      
      onSave(imageDataUrl, meta);
    } catch (error) {
      toast.error("Failed to save story");
      console.error("Save error:", error);
    }
  };

  const activeEl = elements.find((el) => el.id === activeElement);
  const displayMedia = croppedMedia || originalMedia;

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
      <DialogComponent />
      <canvas ref={canvasRef} className="hidden" />
      {musicFile?.dataUrl && <audio ref={audioRef} src={musicFile.dataUrl} loop />}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleMusicUpload}
      />

      {/* Top bar */}
      <div className="p-3 flex justify-between items-center bg-gray-900 border-b border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
        >
          Cancel
        </button>

        <div className="flex gap-2 items-center">
          {!cropMode && (
            <>
              <button
                onClick={addText}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-bold"
                title="Add Text"
              >
                Aa
              </button>
              {musicFile && (
                <button
                  onClick={() => setMusicPlaying(!musicPlaying)}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  {musicPlaying ? "⏸️" : "▶️"}
                </button>
              )}
              {croppedMedia && (
                <button
                  onClick={resetCrop}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors text-sm"
                >
                  Reset Crop
                </button>
              )}
            </>
          )}
        </div>

        <button
          className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors text-sm"
          onClick={cropMode ? applyCrop : handleSave}
        >
          {cropMode ? "Done" : "Save"}
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor preview */}
        <div className="flex-1 flex items-center justify-center bg-gray-950 p-4">
          <div
            ref={editorRef}
            className="relative w-full max-w-[340px] h-full max-h-[600px] bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget && !cropMode) {
                setActiveElement(null);
              }
            }}
          >
            {cropMode ? (
              /* Crop mode */
              <div className="relative w-full h-full flex items-center justify-center bg-gray-950">
                <div className="relative w-[340px] h-[604px] bg-black rounded-xl overflow-hidden">
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-move"
                    onMouseDown={startCropPan}
                    onTouchStart={startCropPan}
                  >
                    <img
                      ref={cropImageRef}
                      src={originalMedia}
                      className="select-none"
                      alt="crop"
                      draggable={false}
                      onLoad={(e) => {
                        const imgEl = e.target;
                        const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
                        const frameAspect = 340 / 604;
                        
                        if (imgAspect > frameAspect) {
                          imgEl.style.width = '340px';
                          imgEl.style.height = 'auto';
                        } else {
                          imgEl.style.height = '604px';
                          imgEl.style.width = 'auto';
                        }
                      }}
                      style={{
                        transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropZoom})`,
                        transformOrigin: 'center center',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        filter: filters.find((f) => f.name === selectedFilter)?.filter || "",
                      }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white border-opacity-20" />
                      ))}
                    </div>
                  </div>

                  <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-xl" />
                  
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 pointer-events-none rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 pointer-events-none rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 pointer-events-none rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 pointer-events-none rounded-br-xl" />
                </div>
              </div>
            ) : (
              /* Normal edit mode */
              <>
                {type === "image" && (
                  <img
                    ref={imageRef}
                    src={displayMedia}
                    className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                    alt="background"
                    style={{
                      aspectRatio: "auto",
                      filter: filters.find((f) => f.name === selectedFilter)?.filter || "",
                    }}
                  />
                )}
                {type === "video" && (
                  <video
                    src={displayMedia}
                    autoPlay
                    loop
                    muted
                    className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                    style={{
                      aspectRatio: "auto",
                      filter: filters.find((f) => f.name === selectedFilter)?.filter || "",
                    }}
                  />
                )}

                {/* Elements layer */}
                <div className="absolute inset-0 pointer-events-none">
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      onMouseDown={(e) => startDrag(e, el)}
                      onTouchStart={(e) => startDrag(e, el)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveElement(el.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (el.type === "text") editText(el.id);
                      }}
                      className={`absolute cursor-move select-none pointer-events-auto ${
                        activeElement === el.id ? "ring-2 ring-blue-400" : ""
                      }`}
                      style={{
                        left: el.x,
                        top: el.y,
                        transform: `translate(-50%, -50%) scale(${el.scale}) rotate(${el.rotate}deg)`,
                        color: el.color,
                        fontSize: el.fontSize,
                        fontWeight: "bold",
                      }}
                    >
                      {el.type === "text" && (
                        <div className="whitespace-nowrap px-2">{el.content}</div>
                      )}
                      {el.type === "sticker" && (
                        <div className="text-6xl">{el.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right sidebar - Tools */}
        {!cropMode && (
          <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 text-xs">
              <button
                onClick={() => setActiveTab("stickers")}
                className={`flex-1 py-3 font-medium transition-colors ${
                  activeTab === "stickers" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                🎨
              </button>
              <button
                onClick={() => setActiveTab("filters")}
                className={`flex-1 py-3 font-medium transition-colors ${
                  activeTab === "filters" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                ✨
              </button>
              <button
                onClick={() => setActiveTab("crop")}
                className={`flex-1 py-3 font-medium transition-colors ${
                  activeTab === "crop" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                ✂️
              </button>
              <button
                onClick={() => setActiveTab("music")}
                className={`flex-1 py-3 font-medium transition-colors ${
                  activeTab === "music" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                🎵
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "stickers" && (
                <div className="grid grid-cols-4 gap-3">
                  {["❤️", "😂", "🔥", "✨", "🎉", "💯", "👍", "🙌", "😍", "🥳", "💪", "🌟", "⭐", "💖", "🎈", "🎊"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addSticker(emoji)}
                        className="text-4xl p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              )}

              {activeTab === "filters" && (
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => {
                        setSelectedFilter(filter.name);
                        if (filter.name !== "none") {
                          toast.success(`${filter.label} filter applied! ✨`);
                        }
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedFilter === filter.name
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "crop" && type === "image" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Story Crop</h3>
                  
                  <button
                    onClick={startCropMode}
                    className="w-full p-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg transition-colors flex items-center justify-center gap-3 font-medium"
                  >
                    <div className="w-8 h-14 border-2 border-white rounded" />
                    <span>Crop for Story (9:16)</span>
                  </button>

                  <div className="text-xs text-gray-400 p-3 bg-gray-800 rounded">
                    💡 Crop your image to fit perfectly in Instagram/Snapchat stories
                  </div>
                </div>
              )}

              {activeTab === "crop" && type === "video" && (
                <div className="text-sm text-gray-400 p-4 bg-gray-800 rounded">
                  ⚠️ Cropping is only available for images
                </div>
              )}

              {activeTab === "music" && (
                <div className="space-y-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-colors"
                  >
                    {musicFile ? "✓ Music Added" : "+ Upload Music"}
                  </button>

                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Music Library</h3>
                    <div className="space-y-2">
                      {musicLibrary.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => selectLibraryMusic(track)}
                          className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors flex items-center gap-3"
                        >
                          <span className="text-2xl">{track.emoji}</span>
                          <span className="text-sm">{track.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {musicFile && (
                    <div className="space-y-3 p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Current Track:</span>
                        <button
                          onClick={() => {
                            setMusicFile(null);
                            setMusicPlaying(false);
                            setMusicStartTime(0);
                            toast.info("Music removed");
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{musicFile.name}</p>
                      
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Start Time: {musicStartTime.toFixed(1)}s
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={audioRef.current?.duration || 30}
                          step="0.1"
                          value={musicStartTime}
                          onChange={handleStartTimeChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 p-3 bg-gray-800 rounded">
                    💡 Add background music to your story. Music will loop automatically.
                  </div>
                </div>
              )}
            </div>

            {/* Element controls (when element is selected) */}
            {activeEl && !cropMode && (
              <div className="border-t border-gray-700 p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Edit Element</h3>
                
                {/* Scale */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Size: {activeEl.scale.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={activeEl.scale}
                    onChange={(e) =>
                      updateElement(activeEl.id, { scale: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Rotation: {activeEl.rotate}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={activeEl.rotate}
                    onChange={(e) =>
                      updateElement(activeEl.id, { rotate: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                {/* Text color (only for text) */}
                {activeEl.type === "text" && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Text Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", 
                        "#ff00ff", "#00ffff", "#ff8800", "#8800ff", "#00ff88", "#ff0088"].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateElement(activeEl.id, { color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            activeEl.color === color ? "border-white" : "border-gray-600"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={() => deleteElement(activeEl.id)}
                  className="w-full p-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Element
                </button>
              </div>
            )}

            {/* Crop controls (when in crop mode) */}
            {cropMode && (
              <div className="border-t border-gray-700 p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Crop Controls</h3>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Zoom: {cropZoom.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={handleCropZoomChange}
                    className="w-full"
                  />
                </div>

                <div className="text-xs text-gray-400 p-3 bg-gray-800 rounded">
                  <p className="mb-2">🖱️ <strong>Drag</strong> to reposition</p>
                  <p>🔍 <strong>Slide</strong> to zoom in/out</p>
                </div>

                <button
                  onClick={() => {
                    setCropZoom(1);
                    setCropPosition({ x: 0, y: 0 });
                    toast.info("Crop reset");
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset Position & Zoom
                </button>
              </div>
            )}
          </div>
        )}

        {/* Crop controls (when in crop mode and no sidebar) */}
        {cropMode && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-xl p-4 shadow-2xl border border-gray-700 z-10">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">Zoom:</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={handleCropZoomChange}
                className="w-48"
              />
              <span className="text-sm text-white font-medium">{cropZoom.toFixed(2)}x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}