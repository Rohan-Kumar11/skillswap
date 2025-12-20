"use client";
import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Maximize2 } from 'lucide-react';

export default function ImageCropper({ isOpen, onClose, image, onCrop, cropShape, cropType = 'post' }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Resizable crop box state with aspect ratio lock
  const [cropBox, setCropBox] = useState({ width: 400, height: 400, x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(1); // Track current aspect ratio
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, aspectRatio: 1 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Load image
  useEffect(() => {
    if (!image) return;
    
    const loadImage = (src) => {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // Calculate initial image size
          let scale;
          if (cropType === 'cover') {
            scale = Math.max(
              (containerRect.width * 0.95) / img.width,
              (containerRect.height * 0.8) / img.height
            );
          } else {
            scale = Math.min(
              (containerRect.width * 0.9) / img.width,
              (containerRect.height * 0.9) / img.height,
              1
            );
          }
          
          setImageSize({ width: img.width * scale, height: img.height * scale });
          
          // Set initial crop box size based on type
          if (cropType === 'cover') {
            // Cover: wide aspect ratio (6.2:1)
            const coverWidth = containerRect.width * 0.85;
            const coverHeight = coverWidth / 6.2;
            setCropBox({
              width: coverWidth,
              height: coverHeight,
              x: (containerRect.width - coverWidth) / 2,
              y: (containerRect.height - coverHeight) / 2
            });
            setAspectRatio(6.2);
          } else {
            // Post: start with 1:1 (square)
            const size = Math.min(containerRect.width, containerRect.height) * 0.7;
            setCropBox({
              width: size,
              height: size,
              x: (containerRect.width - size) / 2,
              y: (containerRect.height - size) / 2
            });
            setAspectRatio(1);
          }
        }
      };
      img.onerror = () => {
        alert('Failed to load image. Please try again.');
      };
      img.src = src;
    };

    if (typeof image === 'string') {
      loadImage(image);
    } else if (image instanceof Blob || image instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => loadImage(e.target.result);
      reader.onerror = () => alert('Failed to read file. Please try again.');
      reader.readAsDataURL(image);
    }
  }, [image, cropType]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Image drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0 || isResizing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setCrop({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Touch handlers for image drag
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1 || isResizing) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - crop.x, y: touch.clientY - crop.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    setCrop({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Resize handlers with aspect ratio lock (ALWAYS LOCKED)
  const handleResizeStart = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    if (cropType === 'cover') return;
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX || e.touches?.[0]?.clientX,
      y: e.clientY || e.touches?.[0]?.clientY,
      width: cropBox.width,
      height: cropBox.height,
      aspectRatio: cropBox.width / cropBox.height
    });
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !containerRef.current) return;
    
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const minSize = 100;
    const maxWidth = containerRect.width * 0.9;
    const maxHeight = containerRect.height * 0.9;
    
    let newWidth = cropBox.width;
    let newHeight = cropBox.height;
    let newX = cropBox.x;
    let newY = cropBox.y;
    
    // ALWAYS maintain aspect ratio
    const currentAspectRatio = resizeStart.aspectRatio;
    
    // Determine which dimension to prioritize based on handle direction
    if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
      // Horizontal resize - width drives height
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(minSize, Math.min(maxWidth, resizeStart.width + deltaX));
      } else if (resizeHandle.includes('w')) {
        newWidth = Math.max(minSize, Math.min(maxWidth, resizeStart.width - deltaX));
      }
      newHeight = newWidth / currentAspectRatio;
      
      // Adjust if height exceeds max
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * currentAspectRatio;
      }
      
      // Update X position for west handles
      if (resizeHandle.includes('w') && newWidth >= minSize) {
        newX = cropBox.x + (cropBox.width - newWidth);
      }
      
      // Update Y position to keep centered for east/west only handles
      if (resizeHandle === 'e' || resizeHandle === 'w') {
        newY = cropBox.y + (cropBox.height - newHeight) / 2;
      }
    } else if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
      // Vertical resize - height drives width
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(minSize, Math.min(maxHeight, resizeStart.height + deltaY));
      } else if (resizeHandle.includes('n')) {
        newHeight = Math.max(minSize, Math.min(maxHeight, resizeStart.height - deltaY));
      }
      newWidth = newHeight * currentAspectRatio;
      
      // Adjust if width exceeds max
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / currentAspectRatio;
      }
      
      // Update Y position for north handles
      if (resizeHandle.includes('n') && newHeight >= minSize) {
        newY = cropBox.y + (cropBox.height - newHeight);
      }
      
      // Update X position to keep centered for north/south only handles
      if (resizeHandle === 'n' || resizeHandle === 's') {
        newX = cropBox.x + (cropBox.width - newWidth) / 2;
      }
    }
    
    // Corner handles - use diagonal distance
    if ((resizeHandle.includes('n') || resizeHandle.includes('s')) && 
        (resizeHandle.includes('e') || resizeHandle.includes('w'))) {
      const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const sign = (resizeHandle.includes('e') ? 1 : -1) * (resizeHandle.includes('s') ? 1 : -1);
      
      newWidth = Math.max(minSize, Math.min(maxWidth, resizeStart.width + diagonal * sign));
      newHeight = newWidth / currentAspectRatio;
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * currentAspectRatio;
      }
      
      if (resizeHandle.includes('w')) {
        newX = cropBox.x + (cropBox.width - newWidth);
      }
      if (resizeHandle.includes('n')) {
        newY = cropBox.y + (cropBox.height - newHeight);
      }
    }
    
    // Ensure crop box stays within container
    newX = Math.max(0, Math.min(containerRect.width - newWidth, newX));
    newY = Math.max(0, Math.min(containerRect.height - newHeight, newY));
    
    setCropBox({ width: newWidth, height: newHeight, x: newX, y: newY });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('touchmove', handleResizeMove);
        window.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart, cropBox]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Apply crop
  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // High quality output - maintain aspect ratio
      const currentAspectRatio = cropBox.width / cropBox.height;
      const maxOutputSize = 1920;
      
      let outputWidth, outputHeight;
      if (currentAspectRatio >= 1) {
        outputWidth = Math.min(maxOutputSize, cropBox.width * 2);
        outputHeight = outputWidth / currentAspectRatio;
      } else {
        outputHeight = Math.min(maxOutputSize, cropBox.height * 2);
        outputWidth = outputHeight * currentAspectRatio;
      }
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, outputWidth, outputHeight);
      
      ctx.save();
      
      const imgRect = img.getBoundingClientRect();
      const relativeX = imgRect.left - containerRect.left - cropBox.x;
      const relativeY = imgRect.top - containerRect.top - cropBox.y;
      
      const scale = outputWidth / cropBox.width;
      
      const centerX = outputWidth / 2;
      const centerY = outputHeight / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
      
      const scaledWidth = imgRect.width * scale;
      const scaledHeight = imgRect.height * scale;
      const scaledX = relativeX * scale;
      const scaledY = relativeY * scale;
      
      ctx.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight);
      
      if (cropShape === 'circle') {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCrop(blob);
          handleClose();
        } else {
          alert('Failed to process image. Please try again.');
          setIsProcessing(false);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Crop error:', error);
      alert('Failed to crop image. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setImageSrc(null);
    onClose();
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Zoom to fit button
  const handleZoomToFit = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const imgWidth = imageSize.width;
    const imgHeight = imageSize.height;
    
    const zoomX = cropBox.width / imgWidth;
    const zoomY = cropBox.height / imgHeight;
    const newZoom = Math.max(zoomX, zoomY) * zoom;
    
    setZoom(Math.min(3, Math.max(0.5, newZoom)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'Enter' && !isProcessing) handleCrop();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing]);

  if (!isOpen) return null;

  const currentRatio = cropBox.width / cropBox.height;
  const ratioText = currentRatio >= 1 
    ? `${currentRatio.toFixed(2)}:1` 
    : `1:${(1/currentRatio).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-800">
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
          aria-label="Cancel"
        >
          <X size={24} />
        </button>
        <h2 className="text-white text-base font-semibold">
          {cropType === 'cover' ? 'Edit Cover Image' : 'New Post'}
        </h2>
        <button
          onClick={handleCrop}
          disabled={isProcessing}
          className="text-blue-500 hover:text-blue-400 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Next'}
        </button>
      </div>

      {/* Main Crop Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
          style={{ 
            cursor: isDragging ? 'grabbing' : isResizing ? 'default' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imageSrc ? (
            <>
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="absolute select-none pointer-events-none"
                style={{
                  transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${imageSize.width / 2}px`,
                  marginTop: `-${imageSize.height / 2}px`,
                }}
                draggable={false}
              />
              
              {/* Crop Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  <defs>
                    <mask id="cropMask">
                      <rect width="100%" height="100%" fill="white" />
                      {cropShape === 'circle' ? (
                        <circle
                          cx={cropBox.x + cropBox.width / 2}
                          cy={cropBox.y + cropBox.height / 2}
                          r={Math.min(cropBox.width, cropBox.height) / 2}
                          fill="black"
                        />
                      ) : (
                        <rect
                          x={cropBox.x}
                          y={cropBox.y}
                          width={cropBox.width}
                          height={cropBox.height}
                          fill="black"
                        />
                      )}
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="black" opacity="0.7" mask="url(#cropMask)" />
                  
                  {/* Border */}
                  {cropShape === 'circle' ? (
                    <circle
                      cx={cropBox.x + cropBox.width / 2}
                      cy={cropBox.y + cropBox.height / 2}
                      r={Math.min(cropBox.width, cropBox.height) / 2}
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    />
                  ) : (
                    <rect
                      x={cropBox.x}
                      y={cropBox.y}
                      width={cropBox.width}
                      height={cropBox.height}
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    />
                  )}
                </svg>
              </div>

              {/* Aspect Ratio Display */}
              {cropType === 'post' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm pointer-events-none">
                  {ratioText}
                </div>
              )}

              {/* Resize Handles (only for post type, not cover) */}
              {cropType === 'post' && cropShape !== 'circle' && (
                <div 
                  className="absolute pointer-events-auto"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height
                  }}
                >
                  {/* Corner handles */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    onTouchStart={(e) => handleResizeStart(e, 'nw')}
                    className="absolute -left-2 -top-2 w-6 h-6 bg-white rounded-full cursor-nw-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    onTouchStart={(e) => handleResizeStart(e, 'ne')}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-white rounded-full cursor-ne-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    onTouchStart={(e) => handleResizeStart(e, 'sw')}
                    className="absolute -left-2 -bottom-2 w-6 h-6 bg-white rounded-full cursor-sw-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                    onTouchStart={(e) => handleResizeStart(e, 'se')}
                    className="absolute -right-2 -bottom-2 w-6 h-6 bg-white rounded-full cursor-se-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  
                  {/* Edge handles */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n')}
                    onTouchStart={(e) => handleResizeStart(e, 'n')}
                    className="absolute left-1/2 -translate-x-1/2 -top-2 w-8 h-4 bg-white rounded-full cursor-n-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's')}
                    onTouchStart={(e) => handleResizeStart(e, 's')}
                    className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-8 h-4 bg-white rounded-full cursor-s-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w')}
                    onTouchStart={(e) => handleResizeStart(e, 'w')}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-full cursor-w-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                    onTouchStart={(e) => handleResizeStart(e, 'e')}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-full cursor-e-resize shadow-lg border-2 border-blue-500"
                    style={{ touchAction: 'none' }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-white text-center">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm">Loading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black border-t border-gray-800 px-4 py-4 space-y-4">
        
        {/* Info Text */}
        {cropType === 'post' && (
          <div className="text-center text-gray-400 text-xs">
            {cropShape === 'circle' ? (
              'Drag to reposition • Zoom to adjust'
            ) : (
              'Drag corners to resize • Aspect ratio maintained automatically'
            )}
          </div>
        )}

        {/* Zoom Slider */}
        <div className="flex items-center gap-4">
          <span className="text-white text-sm font-medium w-12">Zoom</span>
          <div className="flex-1 relative h-1 bg-gray-700 rounded-full">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div 
              className="absolute left-0 top-0 h-full bg-white rounded-full"
              style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${((zoom - 0.5) / 2.5) * 100}% - 8px)` }}
            />
          </div>
          <span className="text-white text-sm w-10 text-right">{zoom.toFixed(1)}x</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setRotation((rotation - 90 + 360) % 360)}
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            aria-label="Rotate left"
          >
            <RotateCw size={20} className="transform scale-x-[-1]" />
          </button>
          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            aria-label="Rotate right"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={handleZoomToFit}
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            aria-label="Zoom to fit"
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={handleReset}
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}