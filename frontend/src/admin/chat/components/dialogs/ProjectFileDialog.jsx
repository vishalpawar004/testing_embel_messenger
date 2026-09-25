import { useState, useRef, useMemo, useEffect } from "react";
import { Upload, X, FileText, Archive, Code2, Loader2 } from "lucide-react";
import { getProjects } from "../../../../services/authService";

export default function ProjectFileDialog({ isOpen, onClose, onAttach }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalDragging, setIsModalDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load existing projects from GET /api/attachments/projects
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    (async () => {
      setIsLoadingProjects(true);
      setErrorMessage("");
      try {
        const list = await getProjects();
        if (active) {
          setProjects(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to load existing projects:", err);
      } finally {
        if (active) setIsLoadingProjects(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Clean up object URLs on unmount or file removal
  const previewUrls = useMemo(() => {
    const map = new Map();
    selectedFiles.forEach((file) => {
      if (file.type?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name)) {
        map.set(file.name, URL.createObjectURL(file));
      }
    });
    return map;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isUploading) return;
    setProjectName("");
    setSelectedProjectId("");
    setSelectedFiles([]);
    setErrorMessage("");
    setIsModalDragging(false);
    onClose();
  };

  const addIncomingFiles = (files) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filteredNew = incoming.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filteredNew];
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addIncomingFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop event handlers specifically for the modal
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only turn off if leaving modal boundaries
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsModalDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      addIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedFiles.length === 0 || isUploading) return;

    if (!selectedProjectId && !projectName.trim()) {
      setErrorMessage("Please enter a project name.");
      return;
    }

    const matchedProject = projects.find((p) => String(p.id) === String(selectedProjectId));
    const finalName = matchedProject?.title || projectName.trim() || "Untitled Project";

    setIsUploading(true);
    setErrorMessage("");

    try {
      await onAttach({
        projectId: selectedProjectId || undefined,
        projectName: finalName,
        files: selectedFiles,
      });

      handleClose();
    } catch (err) {
      console.error("Upload error in ProjectFileDialog:", err);
      setErrorMessage(err.message || "Upload failed. Please check network/console.");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file) => {
    const name = (file.name || "").toLowerCase();

    if (previewUrls.has(file.name)) {
      return (
        <img
          src={previewUrls.get(file.name)}
          alt={file.name}
          className="h-6 w-6 rounded object-cover"
        />
      );
    }
    if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) {
      return <Archive size={16} className="shrink-0 text-[#168A72]" />;
    }
    if (/\.(java|js|jsx|ts|tsx|py|c|cpp|sql|json|xml|html|css|php|rb|go|rs)$/i.test(name)) {
      return <Code2 size={16} className="shrink-0 text-[#3A5CFF]" />;
    }
    if (/\.(pdf)$/i.test(name)) {
      return <FileText size={16} className="shrink-0 text-[#D14343]" />;
    }
    if (/\.(doc|docx)$/i.test(name)) {
      return <FileText size={16} className="shrink-0 text-[#2563EB]" />;
    }
    return <FileText size={16} className="shrink-0 text-[#fd7e13]" />;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={handleClose}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`relative w-full max-w-sm rounded-[16px] bg-white p-5 shadow-2xl transition-all duration-150 ${
          isModalDragging ? "ring-2 ring-[#fd7e13] ring-offset-2" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual drop indicator overlay for the modal */}
        {isModalDragging && (
          <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[16px] bg-white/95 backdrop-blur-[1px]">
            <Upload size={32} className="animate-bounce text-[#fd7e13]" />
            <p className="mt-2 text-[13px] font-semibold text-[#1E2328]">
              Drop files here to add to project
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1E2328]">
            Attach Project File
          </h3>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClose}
            className="rounded-full p-1 text-[#6B7178] hover:bg-[#F1F0EC] hover:text-[#1E2328] disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Select Existing Project */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[11.5px] font-medium text-[#6B7178]">
              <span>Existing Project (Optional)</span>
              {isLoadingProjects && (
                <span className="flex items-center gap-1 text-[10.5px] text-[#9AA0A6]">
                  <Loader2 size={11} className="animate-spin text-[#fd7e13]" /> Loading...
                </span>
              )}
            </label>
            <select
              value={selectedProjectId}
              disabled={isUploading}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                if (e.target.value) setProjectName("");
              }}
              className="w-full rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2 text-[13px] text-[#1E2328] outline-none transition-colors focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
            >
              <option value="">-- Create or type a new project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.title} ({p.fileCount ?? 0} file{(p.fileCount ?? 0) === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          </div>

          {/* New Project Name */}
          {!selectedProjectId && (
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-[#6B7178]">
                New Project Name <span className="text-[#fd7e13]">*</span>
              </label>
              <input
                type="text"
                disabled={isUploading}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Enter project name (e.g. testing)"
                className="w-full rounded-[9px] border border-[#E4E0D6] px-3 py-2 text-[13px] text-[#1E2328] outline-none transition-colors focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
              />
            </div>
          )}

          {/* Attachment Box / Drag Target */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-[11.5px] font-medium text-[#6B7178]">
                Attachment(s)
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-[11px] font-medium text-[#fd7e13]">
                  {selectedFiles.length} selected
                </span>
              )}
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-dashed border-[#C9CDD2] bg-[#F8F7F5] px-3 py-2.5 text-[12.5px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:border-[#fd7e13] disabled:opacity-50"
            >
              <Upload size={15} className="text-[#fd7e13]" />
              {selectedFiles.length > 0 ? "Add more files" : "Choose files / zip / drop here"}
            </button>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex max-h-36 flex-col gap-1 overflow-y-auto rounded-[8px] border border-[#EDEAE2] bg-[#FAF9F6] p-1.5">
                {selectedFiles.map((file, idx) => {
                  const ext = file.name.includes(".")
                    ? file.name.split(".").pop().toUpperCase()
                    : "FILE";

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between rounded border border-[#EDEAE2] bg-white px-2 py-1.5 text-[11.5px]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {getFileIcon(file)}
                        <span className="max-w-[155px] truncate text-[#1E2328]" title={file.name}>
                          {file.name}
                        </span>
                        <span className="rounded bg-[#F1F0EC] px-1 py-0.5 text-[9px] font-bold text-[#6B7178]">
                          {ext}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleRemoveFile(idx)}
                        className="ml-2 text-[#9AA0A6] hover:text-[#D14343] disabled:opacity-30"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="rounded-[8px] bg-[#FFF1F0] p-2 text-[11.5px] font-medium text-[#D14343]">
              {errorMessage}
            </p>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClose}
              className="rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-medium text-[#6B7178] hover:bg-[#F1F0EC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex items-center gap-1.5 rounded-[9px] bg-[#fd7e13] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#e96f08] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                `Attach ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}