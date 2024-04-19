// @ts-nocheck
"use client";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function Generate() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletionStates, setDeletionStates] = useState({});
  const [files, setFiles] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useHistory, setUseHistory] = useState(false);

  const toggleHistory = () => {
    setUseHistory((current) => !current);
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch("https://dkta9n.buildship.run/get-files");
      const fileList = await response.json();
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleInputChange = (e) => {
    setUserQuery(e.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent the default action to stop from submitting the form
      handleSubmitUserQuery();
    }
  };

  const handleSubmitUserQuery = async () => {
    if (!userQuery.trim()) return;

    setIsLoading(true); // Disable input and show loading
    const newItem = {
      type: "user",
      content: userQuery,
    };
    setConversation([...conversation, newItem]); // Add user query to conversation
    setUserQuery(""); // Clear input right after submission starts

    try {
      const response = await fetch(
        "https://dkta9n.buildship.run/generate-content-demo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userQuery: newItem.content, useHistory }),
        }
      );
      const data = await response.json();
      setConversation((prev) => [
        ...prev,
        { type: "system", content: data.content },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setConversation((prev) => [
        ...prev,
        { type: "system", content: "Failed to get response." },
      ]);
    }
    setIsLoading(false);
  };

  const removeFile = async (id) => {
    setDeletionStates((prev) => ({ ...prev, [id]: true })); // Start loading for specific file

    try {
      const response = await fetch("https://dkta9n.buildship.run/remove-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
      } else {
        // handle error if needed
        alert("Failed to delete file.");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error: " + error.message);
    }

    setDeletionStates((prev) => ({ ...prev, [id]: false })); // Stop loading for specific file
  };

  const onDrop = React.useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setFileName(acceptedFiles[0].name);
    setIsUploaded(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".pdf",
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a PDF file to upload.");
      return;
    }
    setIsUploading(true); // Start uploading

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "https://dkta9n.buildship.run/upload-file-demo",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFileUrl(data.url);
        setIsUploaded(false);
        setIsUploading(false); // End uploading
        setFileName(""); // Reset file name after successful upload
        fetchFiles();
      } else {
        throw new Error("Failed to upload file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error: " + error.message);
      setIsUploading(false); // End uploading on error
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800">
      <header className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-14 w-20" />{" "}
          <h1 className="text-2xl font-bold text-4xl">W I S D O M</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="ml-3 text-sm font-medium">Use History</span>
          <label
            htmlFor="use-history"
            className="flex items-center cursor-pointer"
          >
            <div className="relative">
              <input
                id="use-history"
                type="checkbox"
                className="sr-only"
                checked={useHistory}
                onChange={toggleHistory}
              />
              <div
                className={`block ${
                  useHistory ? "bg-blue-500" : "bg-gray-600"
                } w-14 h-8 rounded-full transition-colors duration-300`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transform transition-transform duration-300 ${
                  useHistory ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>
      </header>
      <div className="flex flex-1 overflow-y-auto">
        <div className="w-1/4 p-4 border-r-2 border-gray-300">
          {(!isUploaded || fileName) && (
            <div className=" h-48 flex items-center justify-center border-2 border-gray-500 rounded-lg p-6 my-5 cursor-pointer group">
              {!isUploaded && (
                <div
                  {...getRootProps()}
                  className={`dropzone flex flex-col items-center justify-center space-y-2 ${
                    fileName ? "hidden" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="h-8 w-8 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-600" />
                  <p className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-600">
                    Drag and drop files here
                  </p>
                  <Button size="sm" variant="outline">
                    Browse Files
                  </Button>
                </div>
              )}
              {fileName && (
                <div className="file-info flex items-center justify-between w-full">
                  <p className="truncate flex-1" title={fileName}>
                    {fileName}
                  </p>
                  <Button
                    onClick={handleSubmit}
                    size="sm"
                    variant="outline"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <LoaderIcon className="animate-spin" />
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="overflow-y-auto max-h-96">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 border-b border-gray-200"
              >
                <a
                  href={file.data.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate flex-1 pr-2"
                  title={file.data.originalName}
                >
                  {file.data.originalName}
                </a>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {deletionStates[file.id] ? (
                    <LoaderIcon className="animate-spin" />
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="w-3/4 p-4 space-y-4 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {conversation.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-200 rounded-md p-4 flex items-start space-x-4"
                >
                  {item.type === "user" ? (
                    <UserIcon className="h-8 w-8 text-gray-800" />
                  ) : (
                    <TextIcon className="h-8 w-8 text-gray-800" />
                  )}
                  <div>
                    <p className="text-gray-900 font-medium">{item.content}</p>
                    {isLoading && index === conversation.length - 1 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <LoaderIcon className="h-5 w-5 animate-spin text-gray-800" />
                        <span className="text-gray-800 text-sm">
                          Generating response...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-200 p-4 flex items-center space-x-2">
            <input
              className="flex-1 bg-white rounded-md px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Type your message..."
              type="text"
              value={userQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading} // Disable while loading
            />
            <Button onClick={handleSubmitUserQuery} disabled={isLoading}>
              <SendIcon className="h-5 w-5 text-gray-800" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileSearchIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="m9 18-1.5-1.5" />
    </svg>
  );
}

function LoaderIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="6" />
      <line x1="12" x2="12" y1="18" y2="22" />
      <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
      <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
      <line x1="2" x2="6" y1="12" y2="12" />
      <line x1="18" x2="22" y1="12" y2="12" />
      <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
      <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
    </svg>
  );
}

function UploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function TextIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 6.1H3" />
      <path d="M21 12.1H3" />
      <path d="M15.1 18H3" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
