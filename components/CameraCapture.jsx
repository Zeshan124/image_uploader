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

    // Maintain 1.7:1 aspect ratio crop
    const width = video.videoWidth;
    const height = width / 1.7;

    canvas.width = width;
    canvas.height = height;

    context.drawImage(video, 0, (video.videoHeight - height) / 2, width, height, 0, 0, width, height);

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
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "250px" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <p style={{ marginTop: 10 }}>Please align your CNIC within the camera frame.</p>
      </div>
    </Modal>
  );
};

export default CameraCapture;
