import React, { useState, useEffect } from "react";
import speciesData from "@/species/species.json";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import init, { generate_svg } from "../pkg/svg_generator";

const MushroomSporeApp = () => {
  const [imageHeight, setImageHeight] = useState(166);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<{
    name: string;
    spore_measurements: string;
    shape: string;
    cite?: string;
  } | null>(null);
  const [svgContent, setSvgContent] = useState("");
  const [filteredSpecies, setFilteredSpecies] = useState<
    { name: string; spore_measurements: string; shape: string; cite?: string }[]
  >([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageOpacity, setImageOpacity] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [citationText, setCitationText] = useState("");

  useEffect(() => {
    if (searchQuery) {
      const filtered = speciesData.filter((species) =>
        species.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredSpecies(filtered);
    } else {
      const filtered = speciesData.filter((species) =>
        species.name.toLowerCase().includes(" "),
      );
      setFilteredSpecies(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    const loadWasm = async () => {
      await init();
      if (selectedSpecies) {
        const svg = generate_svg(
          selectedSpecies.spore_measurements,
          selectedSpecies.shape,
          selectedSpecies.name,
          imageHeight,
        );
        setSvgContent(svg);
        setCitationText(selectedSpecies.cite || "");
      }
    };
    loadWasm();
  }, [imageHeight, selectedSpecies]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (
      e.dataTransfer &&
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const img = new Image();
          img.onload = () => {
            // Scale image to match 800px height while maintaining aspect ratio
            const scaledWidth = (img.width / img.height) * 800;
            const canvas = document.createElement("canvas");
            canvas.height = 800;
            canvas.width = scaledWidth;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, scaledWidth, 800);
            }
            setUploadedImage(canvas.toDataURL());
          };
          if (event.target && event.target.result) {
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Section - Search Navigation */}
      <div className="w-72 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 sticky top-0 bg-white border-b border-gray-200">
          <div className="relative">
            <Input
              type="text"
              placeholder="Suche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="space-y-1 p-2">
          {filteredSpecies.map((species) => (
            <div
              key={species.name}
              className={`cursor-pointer px-3 py-2 rounded-md text-sm transition-colors ${
                selectedSpecies?.name === species.name
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedSpecies(species)}
            >
              {species.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Controls */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 min-w-[200px]">
              <label className="text-sm font-medium whitespace-nowrap">
                Abbildungshöhe:
              </label>
              <Input
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(Number(e.target.value))}
                min={1}
                className="w-24"
              />
              <span className="text-sm text-gray-500">µm</span>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium whitespace-nowrap">
                Transparenz:
              </label>
              <Slider
                value={[imageOpacity]}
                onValueChange={(value) => setImageOpacity(value[0])}
                max={100}
                step={1}
                className="w-48"
              />
              <span className="text-sm text-gray-500 min-w-[3ch]">
                {imageOpacity}%
              </span>
            </div>
          </div>
        </div>

        {/* SVG Display Area */}
        <div className="flex-1 p-4 overflow-auto">
          <div
            className={`w-[800px] h-[800px] mx-auto relative bg-white rounded-lg shadow-sm border border-gray-200 ${
              isDragging ? "ring-2 ring-blue-500" : ""
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            {/* SVG Layer */}
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="absolute inset-0 w-full h-full"
            />

            {/* Image Overlay Layer */}
            {uploadedImage && (
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={uploadedImage}
                  alt="Uploaded microscope image"
                  style={{
                    opacity: imageOpacity / 100,
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}

            {/* Drag Overlay */}
            {!uploadedImage && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <span>
                  Bild hier ablegen oder
                  <button
                    onClick={() =>
                      document.getElementById("fileInput")?.click()
                    }
                    className="ml-1 text-blue-500 hover:text-blue-600 underline focus:outline-none"
                  >
                    auswählen
                  </button>
                </span>
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
              </div>
            )}
          </div>

          {/* Citation */}
          {citationText && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <i>Sporenmaße nach: {citationText}</i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MushroomSporeApp;
