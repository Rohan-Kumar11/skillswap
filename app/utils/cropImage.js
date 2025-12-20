// app/utils/cropImage.js
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });

  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const safeArea = Math.max(image.width, image.height) * 2;

  // set canvas to safe area for rotation
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to center to rotate and draw
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw the image centered in the canvas
  const x = (safeArea - image.width) / 2;
  const y = (safeArea - image.height) / 2;
  ctx.drawImage(image, x, y);

  // extract the cropped area from the rotated image
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas to final desired crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste the extracted pixels at the proper offset
  // calculate offset to position original crop area correctly
  const dx = - (safeArea / 2 - image.width / 2) - pixelCrop.x;
  const dy = - (safeArea / 2 - image.height / 2) - pixelCrop.y;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = safeArea;
  tmpCanvas.height = safeArea;
  const tmpCtx = tmpCanvas.getContext("2d");
  tmpCtx.putImageData(data, 0, 0);

  const finalCtx = canvas.getContext("2d");
  finalCtx.drawImage(tmpCanvas, dx, dy);

  // return base64 image
  return canvas.toDataURL("image/png");
}
