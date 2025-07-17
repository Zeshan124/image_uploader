import React, { useRef, useState, useEffect } from "react";
import { Modal, Button } from "antd";

const CameraCapture = ({ visible, onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (visible && typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          setStream(stream);
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Camera access error:", err);
        });
    } else if (!navigator.mediaDevices) {
      alert("Your browser does not support camera access.");
    }
  
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [visible]);
  

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
  
    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
  
    // Determine if the video is portrait (vertical) or landscape (horizontal)
    const isPortrait = videoHeight > videoWidth;
  
    // Set the output width and height for 1.7:1 aspect ratio
    let outputWidth, outputHeight;
    if (isPortrait) {
      // For portrait, use the height as the limiting factor
      outputHeight = videoHeight;
      outputWidth = outputHeight * 1.7;
      if (outputWidth > videoWidth) {
        outputWidth = videoWidth;
        outputHeight = outputWidth / 1.7;
      }
    } else {
      // For landscape, use the width as the limiting factor
      outputWidth = videoWidth;
      outputHeight = outputWidth / 1.7;
      if (outputHeight > videoHeight) {
        outputHeight = videoHeight;
        outputWidth = outputHeight * 1.7;
      }
    }
  
    // Set canvas size
    canvas.width = outputWidth;
    canvas.height = outputHeight;
  
    context.save();
  
    if (isPortrait) {
      // Rotate the canvas to landscape
      context.translate(outputWidth / 2, outputHeight / 2);
      context.rotate(-Math.PI / 2);
      context.drawImage(
        video,
        (videoWidth - outputHeight) / 2,
        (videoHeight - outputWidth) / 2,
        outputHeight,
        outputWidth,
        -outputHeight / 2,
        -outputWidth / 2,
        outputHeight,
        outputWidth
      );
    } else {
      // No rotation needed
      context.drawImage(
        video,
        (videoWidth - outputWidth) / 2,
        (videoHeight - outputHeight) / 2,
        outputWidth,
        outputHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }
  
    context.restore();
  
    canvas.toBlob((blob) => {
      const file = new File([blob], `cnic-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    }, "image/jpeg", 1.0);
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="capture" type="primary" onClick={handleCapture}>Capture</Button>
      ]}
      width={400}
    >
      <div style={{ textAlign: "center" }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "300px" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <p style={{ marginTop: 10 }}>Please align your CNIC within the camera frame.</p>
      </div>
    </Modal>
  );
};

export default CameraCapture;
