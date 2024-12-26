import React, { useState, useEffect } from 'react';
import speciesData from '@/species/species.json';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import init, { generate_svg } from '../pkg/svg_generator';

const MushroomSporeApp = () => {
  const [imageHeight, setImageHeight] = useState(166);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<{ name: string; spore_measurements: string; shape: string; cite?: string } | null>(null);
  const [svgContent, setSvgContent] = useState('');
  const [filteredSpecies, setFilteredSpecies] = useState<
    { name: string; spore_measurements: string; shape: string; cite?: string }[]
  >([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageOpacity, setImageOpacity] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [citationText, setCitationText] = useState("");

  useEffect(() => {
    if (searchQuery) {
      const filtered = speciesData.filter(species =>
        species.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSpecies(filtered);
    } else {
      const filtered = speciesData.filter(species =>
        species.name.toLowerCase().includes(" ")
      );
      setFilteredSpecies(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    const loadWasm = async () => {
      await init();
      if (selectedSpecies) {
        const svg = generate_svg(selectedSpecies.spore_measurements, selectedSpecies.shape, selectedSpecies.name, imageHeight);
        setSvgContent(svg);
        setCitationText(selectedSpecies.cite || '');
      }
    };
    loadWasm();
  }, [imageHeight, selectedSpecies]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const img = new Image();
          img.onload = () => {
            // Scale image to match 800px height while maintaining aspect ratio
            const scaledWidth = (img.width / img.height) * 800;
            const canvas = document.createElement('canvas');
            canvas.height = 800;
            canvas.width = scaledWidth;
            const ctx = canvas.getContext('2d');
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
    <div className="flex h-screen bg-gray-100">
      {/* Left Section - Search Navigation */}
      <div className="w-64 bg-white p-4 shadow-md">
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
        <div className="mt-4 space-y-2">
          {filteredSpecies.map(species => (
            <div
              key={species.name}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded"
              onClick={() => setSelectedSpecies(species)}
            >
              {species.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Top Controls */}
        <div className="mb-4 flex items-center gap-8">
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

        {/* SVG Display Area */}
        <div 
          className={`w-full aspect-square relative ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
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
            <div className="p-0 relative w-[800px] h-[800px] mx-auto">
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
                    objectFit: 'cover', // Changed from 'contain' to 'cover'
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
            )}
            {/* Drag Overlay */}
            {!uploadedImage && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                Bild hier ablegen oder<a href="#" onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('fileInput')?.click();
                  }}
                  className="pointer-events-auto ml-2 text-blue-500 underline">auswählen</a>
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>
          {/* Citation (only when citationText available*/}
          {citationText && (
            <div>
              <i>Sporenmaße nach: {citationText}</i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MushroomSporeApp;
