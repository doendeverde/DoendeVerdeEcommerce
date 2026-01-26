"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
  multiple?: boolean;
}

export function CloudinaryUpload({
  onUpload,
  folder = "products",
  className,
  multiple = true,
}: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success" && result.info && typeof result.info !== "string") {
      const secureUrl = result.info.secure_url;
      onUpload(secureUrl);
    }
  };

  return (
    <CldUploadWidget
      uploadPreset="ml_default"
      options={{
        folder: folder,
        multiple: multiple,
        maxFiles: 10,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
        maxFileSize: 5000000, // 5MB
        sources: ["local", "url", "camera"],
        language: "pt",
        text: {
          pt: {
            or: "ou",
            menu: {
              files: "Meus Arquivos",
              web: "URL da Web",
              camera: "Câmera",
            },
            local: {
              browse: "Procurar",
              dd_title_single: "Arraste a imagem aqui",
              dd_title_multi: "Arraste as imagens aqui",
              drop_title_single: "Solte a imagem para upload",
              drop_title_multiple: "Solte as imagens para upload",
            },
            url: {
              inner_title: "URL pública da imagem:",
              input_placeholder: "https://exemplo.com/imagem.jpg",
            },
            queue: {
              title: "Fila de Upload",
              title_uploading_with_counter: "Enviando {{num}} arquivos",
              mini_title: "Enviados",
              mini_title_uploading: "Enviando",
              done: "Concluído",
              statuses: {
                uploading: "Enviando...",
                error: "Erro",
                uploaded: "Enviado",
                aborted: "Cancelado",
              },
            },
          },
        },
      }}
      onOpen={() => setIsUploading(true)}
      onClose={() => setIsUploading(false)}
      onSuccess={handleUpload}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          disabled={isUploading}
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-border rounded-lg transition-colors",
            "hover:border-primary-purple hover:bg-primary-purple/5",
            isUploading && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary-purple" />
              <span className="text-sm text-text-secondary">Processando...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-primary-purple" />
              <span className="text-sm text-text-primary">
                Clique para enviar imagens
              </span>
            </>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}
