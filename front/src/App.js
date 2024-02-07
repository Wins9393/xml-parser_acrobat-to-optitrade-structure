import { useEffect, useState } from "react";
import { Button, Input, message, Select, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./App.css";

const { Dragger } = Upload;

function App() {
  const [xmlStructure, setXmlStructure] = useState("Optitrade");
  const [inputFileNumber, setInputFileNumber] = useState(null);
  const [testProduction, setTestProduction] = useState(null);
  const [disableUpload, setDisableUpload] = useState(true);
  // const [lastFileResponse, setLastFileResponse] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (inputFileNumber !== null && testProduction !== null) {
      setDisableUpload(false);
    } else {
      setDisableUpload(true);
    }
  }, [inputFileNumber, testProduction]);

  // useEffect(() => {
  //   if (lastFileResponse) {
  //     handleDownload(lastFileResponse);
  //   }
  // }, [lastFileResponse]);

  const props = {
    name: "file",
    multiple: true,
    disabled: disableUpload,
    beforeUpload: (file) => {
      setFiles((currentFiles) => [...currentFiles, file]);
      return false;
    },
    onRemove: (file) => {
      setFiles((currentFiles) =>
        currentFiles.filter((f) => f.uid !== file.uid)
      );
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleUploadOptitrade = async () => {
    const data = new FormData();

    files.forEach((file) => {
      data.append("files", file);
    });
    data.append("inputFileNumber", inputFileNumber);
    data.append("testProduction", testProduction);

    const response = await fetch(
      "http://localhost:5555/api/structure-optitrade-xml",
      {
        method: "POST",
        body: data,
      }
    );

    if (response.ok) {
      handleDownload(response);
    } else {
      message.error(`File upload failed.`);
    }
  };

  const handleUploadCentrop = async () => {
    const data = new FormData();

    files.forEach((file) => {
      data.append("files", file);
    });
    data.append("inputFileNumber", inputFileNumber);
    data.append("testProduction", testProduction);

    const response = await fetch(
      "http://localhost:5555/api/structure-centrop-xml",
      {
        method: "POST",
        body: data,
      }
    );

    if (response.ok) {
      handleDownload(response);
    } else {
      message.error(`File upload failed.`);
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xml`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (response) => {
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition?.split("filename=")[1];
    const blob = await response.blob();

    downloadFile(blob, filename);
  };

  const handleOnChange = async (info) => {
    const { status } = info.file;
    if (status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
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

  const handleTestProduction = (value) => {
    let userSelectTestProduction = value;
    setTestProduction(userSelectTestProduction);
  };

  return (
    <div className="app">
      <header className={`app-header ${xmlStructure}`}>
        <div className="header-title">{`XML for ${xmlStructure}`}</div>
        <Select
          options={[
            { value: "Optitrade", label: "Optitrade" },
            { value: "Centrop", label: "Centrop" },
          ]}
          style={{ width: "200px" }}
          defaultValue={"Optitrade"}
          onChange={(value) => setXmlStructure(value)}
        ></Select>
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
          <Dragger {...props} onChange={handleOnChange}>
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
          <Button
            onClick={
              xmlStructure === "Optitrade"
                ? handleUploadOptitrade
                : handleUploadCentrop
            }
          >
            Upload files
          </Button>
        </div>
      </section>
    </div>
  );
}

export default App;
