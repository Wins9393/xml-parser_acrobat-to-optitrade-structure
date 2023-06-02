import { useEffect, useState } from "react";
import { Input, message, Select, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./App.css";

const { Dragger } = Upload;

function App() {
  const [inputFileNumber, setInputFileNumber] = useState(null);
  const [testProduction, setTestProduction] = useState(null);
  const [disableUpload, setDisableUpload] = useState(true);

  useEffect(() => {
    if (inputFileNumber !== null && testProduction !== null) {
      setDisableUpload(false);
    } else {
      setDisableUpload(true);
    }
  }, [inputFileNumber, testProduction]);

  const props = {
    name: "file",
    multiple: true,
    disabled: disableUpload,
    customRequest: async (options) => {
      const data = new FormData();
      data.append("file", options.file);
      data.append("inputFileNumber", inputFileNumber);
      data.append("testProduction", testProduction);

      console.log("data", data);

      const response = await fetch("http://localhost:5555/api/structure-xml", {
        method: "POST",
        body: data,
      });
      const contentDisposition = response?.headers?.get("Content-Disposition");
      const filename = contentDisposition?.split("filename=")[1];

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.xml`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (response.ok) {
        options.onSuccess("Ok");
      } else {
        options.onError("Error");
      }
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleInputFileName = (e) => {
    let userInputFileNumber = e.target.value;
    const regex = /^(?!00000)[0-9]{0,5}$/;

    if (regex.test(userInputFileNumber)) {
      if (userInputFileNumber === "") {
        setInputFileNumber(null);
      } else {
        setInputFileNumber(userInputFileNumber);
      }
    }
  };

  const handleTestProduction = (e) => {
    let userSelectTestProduction = e;
    setTestProduction(userSelectTestProduction);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">XML for Optitrade</div>
      </header>
      <section className="main">
        <div className="doc-infos">
          <Input
            addonBefore="File Number"
            value={inputFileNumber}
            maxLength={5}
            onChange={handleInputFileName}
            style={{ marginBottom: "8px" }}
          />
          <Select
            placeholder="Test / Production"
            onChange={handleTestProduction}
            options={[
              { value: "test", label: "Test" },
              { value: "production", label: "Production" },
            ]}
            style={{ width: "100%" }}
          />
        </div>
        <div className="doc-upload">
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload.
            </p>
          </Dragger>
        </div>
      </section>
    </div>
  );
}

export default App;
