"use client";
import { useState, useRef } from "react";
import { useToast } from "./Toast";

interface FileUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  maxSize?: number; // MB
  label?: string;
}

export default function FileUpload({
  onUpload,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar",
  maxSize = 10,
  label = "上传文件",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      show(`文件大小不能超过 ${maxSize}MB`, "error");
      return;
    }

    // 图片预览
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        show("上传成功", "success");
        onUpload(data.data.url);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      show("上传失败", "error");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          background: "#238636",
          color: "#fff",
          border: "1px solid #2ea043",
        }}
      >
        {uploading ? "上传中..." : label}
      </button>
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="预览"
            className="max-w-xs rounded-md border"
            style={{ borderColor: "#30363d" }}
          />
        </div>
      )}
    </div>
  );
}
