"use client";

import React, { useEffect, useState } from "react";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Form,
  Input,
  Upload,
  Button,
  Row,
  Col,
  Card,
  notification,
  message,
} from "antd";
import CameraCapture from "./CameraCapture";

// Utility to convert base64 to File object (from your team)
const base64ToFile = (base64, fileName) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeUpload = (file) => {
  // Allow all image types including camera images
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("You can only upload image files!");
    return false;
  }

  // Check file size (2MB limit)
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    notification.error({
      message: "File Too Large",
      description: "Image must be smaller than 2MB!",
      placement: "topRight",
    });
    return false;
  }

  return isImage && isLt2M;
};

const App = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});

  // Handle file selection for each upload field
  const handleFileChange = (fieldName) => (info) => {
    if (info.file.status !== "uploading") {
      let file = info.file.originFileObj || info.file;

      // Handle base64 conversion if needed
      if (typeof file === "string" && file.startsWith("data:")) {
        console.log("Converting base64 to File object for", fieldName);
        file = base64ToFile(file, `${fieldName}-${Date.now()}.jpg`);
      }

      // Update file list
      setFileList((prev) => ({
        ...prev,
        [fieldName]: file,
      }));

      // Generate preview
      getBase64(file, (url) => {
        setImagePreviews((prev) => ({
          ...prev,
          [fieldName]: url,
        }));
      });

      console.log(`File selected for ${fieldName}:`, file);
    }
  };

  // Submit form with all data
  // Submit form with all data
  const handleSubmit = async (values) => {
    setLoading(true);

    notification.info({
      message: "Submitting...",
      description: "Submitting update...",
      placement: "topRight",
    });

    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      Object.entries(fileList).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      // Force PATCH only
      const endpoint = "https://boms.qistbazaar.pk/api/order/greenform/update";

      const response = await fetch(endpoint, {
        method: "PATCH",
        body: formData,
        headers: {
          "x-access-token":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGUiOjQsImJyYW5jaCI6MzAsImlhdCI6MTc0OTc5OTY2MywiZXhwIjoxNzQ5ODM1NjYzfQ.U_-d9TXPpqN9i5UeHXjREksAuGFYDe53CsgiEK8rtAg",
        },
      });

      // Enhanced debugging
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        let result;
        try {
          result = await response.json();
          console.log("API Success Response:", result);
        } catch (jsonError) {
          console.warn("Could not parse JSON response:", jsonError);
          result = await response.text();
          console.log("Response as text:", result);
        }

        // This should now show the success notification
        notification.success({
          message: "Success",
          description: "Order updated successfully!",
          placement: "topRight",
          duration: 6, // Show for 6 seconds
        });

        form.resetFields();
        setFileList({});
        setImagePreviews({});
      } else {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        console.error("Response status:", response.status);

        notification.error({
          message: "Update Failed",
          description: `Failed to update order (Status: ${response.status}). Please check your data and try again.`,
          placement: "topRight",
          duration: 8,
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      notification.error({
        message: "Error",
        description: `Update failed: ${
          error.message || "Unknown error occurred"
        }`,
        placement: "topRight",
        duration: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  
  

  // Custom uploader component
  const CustomUploader = ({ fieldName, title }) => {
    const [cameraVisible, setCameraVisible] = useState(false);

    
  
    const handleCustomCapture = () => {
      setCameraVisible(true);
    };
  
    const handleCapture = (file) => {
      setCameraVisible(false);
  
      setFileList((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
  
      getBase64(file, (url) => {
        setImagePreviews((prev) => ({
          ...prev,
          [fieldName]: url,
        }));
      });
    };
  
    return (
      <>
        <div onClick={handleCustomCapture} style={{ cursor: "pointer" }}>
          {imagePreviews[fieldName] ? (
            <img
              src={imagePreviews[fieldName]}
              alt={fieldName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <button style={{ border: 0, background: "none" }} type="button">
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>{title}</div>
            </button>
          )}
        </div>
  
        <CameraCapture
          visible={cameraVisible}
          onCapture={handleCapture}
          onCancel={() => setCameraVisible(false)}
        />
      </>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Customer Information */}
        <Card title="Customer Information" style={{ marginBottom: "20px" }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Order ID" name="orderID">
                <Input placeholder="Enter order ID" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Full Name" name="fullName">
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Father Name" name="fatherName">
                <Input placeholder="Enter father name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Mother Name" name="motherName">
                <Input placeholder="Enter mother name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="CNIC" name="cnic">
                <Input placeholder="Enter CNIC number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Phone Number" name="phoneNo">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Date of Issue" name="dateOfIssue">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Date of Expiry" name="dateOfExpiry">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Date of Birth" name="dateOfBirth">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Place of Birth" name="PlaceOfBirth">
                <Input placeholder="Enter place of birth" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Source of Earning" name="sourceOfEarning">
                <Input placeholder="Enter source of earning" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Income" name="income">
                <Input placeholder="Enter income amount" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Address" name="address">
                <Input.TextArea rows={2} placeholder="Enter complete address" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Document Uploads */}
        <Card title="Document Uploads" style={{ marginBottom: "20px" }}>
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: "center" }}>
                <CustomUploader fieldName="acknowledgement" title="Upload" />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ width: "200px" }}
          >
            {loading ? "Processing..." : "Submit/Update Order"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default App;
