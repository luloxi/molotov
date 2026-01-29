'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMintArtwork, useArtistProfile } from '../../hooks/useContract';
import { useEthPrice } from '../../hooks/useEthPrice';
import { useCategories } from '../../hooks/useCategories';
import { uploadFileToIPFS, uploadMetadataToIPFS, validateArtworkFile, createArtworkMetadata } from '../../services/ipfs';
import { MintFormData, Category } from '../../types';
import { InfoTooltip } from './InfoTooltip';
import styles from './MintForm.module.css';

interface MintFormProps {
  onSuccess?: (tokenId: string) => void;
}

export function MintForm({ onSuccess: _onSuccess }: MintFormProps) {
  const { address } = useAccount();
  const { data: artistProfile } = useArtistProfile(address);
  const { convertEthToUsd } = useEthPrice();
  const { categories: availableCategories, isLoading: categoriesLoading } = useCategories();
  
  const [formData, setFormData] = useState<MintFormData>({
    title: '',
    description: '',
    file: null,
    price: '',
    isForSale: true,
    royaltyPercentage: 5,
    editionNumber: 1,
    totalEditions: 1,
    attributes: [],
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const [categorySaved, setCategorySaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { mint, isPending, isConfirming, isSuccess, hash, mintedTokenId, error: txError } = useMintArtwork();

  const selectCategory = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  // After successful mint, save category to the artwork
  useEffect(() => {
    const addCategoryToMintedArtwork = async () => {
      if (isSuccess && mintedTokenId && selectedCategory && !categorySaved) {
        try {
          const response = await fetch(`/api/artwork/${mintedTokenId}/categories`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryIds: [selectedCategory] }),
          });

          if (response.ok) {
            setCategorySaved(true);
            console.log('Category saved for artwork:', mintedTokenId);
          } else {
            console.error('Failed to save category');
          }
        } catch (err) {
          console.error('Error saving category:', err);
        }
      }
    };

    addCategoryToMintedArtwork();
  }, [isSuccess, mintedTokenId, selectedCategory, categorySaved]);

  const processFile = useCallback((file: File) => {
    const validation = validateArtworkFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setFormData(prev => ({ ...prev, file }));
    setMediaType(file.type);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const addAttribute = () => {
    if (!newAttribute.trait_type.trim() || !newAttribute.value.toString().trim()) return;
    
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { ...newAttribute }],
    }));
    setNewAttribute({ trait_type: '', value: '' });
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.file) {
      setError('Please select an artwork file');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (formData.isForSale && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('Please set a valid price');
      return;
    }
    
    // Auto-add any pending attribute that hasn't been added yet
    let finalAttributes = [...formData.attributes];
    if (newAttribute.trait_type.trim() && newAttribute.value.toString().trim()) {
      finalAttributes.push({ ...newAttribute });
      setNewAttribute({ trait_type: '', value: '' });
    }
    
    try {
      setIsUploading(true);
      
      // Upload artwork to IPFS
      setUploadProgress('Uploading artwork to IPFS...');
      const artworkUpload = await uploadFileToIPFS(formData.file);
      if (!artworkUpload.success || !artworkUpload.hash) {
        throw new Error(artworkUpload.error || 'Failed to upload artwork');
      }
      
      // Create and upload metadata
      setUploadProgress('Creating metadata...');
      const metadata = createArtworkMetadata(
        formData.title,
        formData.description,
        artworkUpload.hash,
        mediaType,
        {
          name: artistProfile?.name || 'Unknown Artist',
          wallet: address || '',
          verified: artistProfile?.isVerified || false,
        },
        {
          number: formData.editionNumber,
          total: formData.totalEditions,
        },
        finalAttributes
      );
      
      setUploadProgress('Uploading metadata to IPFS...');
      const metadataUpload = await uploadMetadataToIPFS(metadata);
      if (!metadataUpload.success || !metadataUpload.hash) {
        throw new Error(metadataUpload.error || 'Failed to upload metadata');
      }
      
      setUploadProgress('Confirming transaction...');
      setIsUploading(false);
      
      // Mint NFT
      mint(
        formData.title,
        formData.description,
        mediaType,
        artworkUpload.hash,
        metadataUpload.hash,
        formData.isForSale ? formData.price : '0',
        formData.isForSale,
        formData.royaltyPercentage * 100, // Convert to basis points
        formData.editionNumber,
        formData.totalEditions
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  if (isSuccess && hash) {
    return (
      <div className={styles.success}>
        {previewUrl && (
          <div className={styles.successArtwork}>
            {mediaType.startsWith('video') ? (
              <video src={previewUrl} className={styles.successImage} muted loop autoPlay />
            ) : (
              <img src={previewUrl} alt={formData.title} className={styles.successImage} />
            )}
          </div>
        )}
        <div className={styles.successBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span>Minted</span>
        </div>
        <h2 className={styles.successTitle}>{formData.title}</h2>
        <p>Your artwork is now live on the blockchain</p>
        <a 
          href={`/artwork/${mintedTokenId}`}
          className={styles.viewArtworkLink}
        >
          View Artwork
        </a>
        <a 
          href={`https://basescan.org/tx/${hash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.txLink}
        >
          View transaction on Basescan
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Mint New Artwork</h2>
      
      <div 
        className={styles.uploadSection}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label className={styles.uploadLabel}>
          {previewUrl ? (
            <div className={`${styles.previewContainer} ${isDragging ? styles.dragging : ''}`}>
              {mediaType.startsWith('video') ? (
                <video src={previewUrl} className={styles.preview} muted loop autoPlay />
              ) : (
                <img src={previewUrl} alt="Preview" className={styles.preview} />
              )}
              <span className={styles.changeText}>{isDragging ? 'Drop to replace' : 'Click to change'}</span>
            </div>
          ) : (
            <div className={`${styles.uploadPlaceholder} ${isDragging ? styles.dragging : ''}`}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>{isDragging ? 'Drop your artwork here' : 'Upload Artwork'}</span>
              <span className={`${styles.fileTypes} ${styles.dragHint}`}>{isDragging ? '' : 'Drag & drop or click to browse'}</span>
              <span className={styles.fileTypes}>JPG, PNG, GIF (max 10MB)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </label>
        <div className={styles.ipfsNote}>
          <span className={styles.ipfsIcon}>✦</span>
          <span>Your artwork is stored forever on <strong>IPFS</strong> <span className={styles.ipfsSubtext}>· InterPlanetary File System</span></span>
        </div>
      </div>
      
      <div className={styles.field}>
        <label className={styles.label}>
          Title *
          <InfoTooltip text="The name of your artwork as it will appear in the gallery and on marketplaces." />
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Artwork title"
          className={styles.input}
          required
        />
      </div>
      
      <div className={styles.field}>
        <label className={styles.label}>
          Description
          <InfoTooltip text="Tell the story behind your artwork. This helps collectors connect with your work." />
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your artwork..."
          className={styles.textarea}
          rows={3}
        />
      </div>
      
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={formData.isForSale}
              onChange={(e) => setFormData(prev => ({ ...prev, isForSale: e.target.checked }))}
            />
            <span>List for sale</span>
            <InfoTooltip text="Enable this to list your artwork for sale immediately after minting. You can also list it later." />
          </label>
        </div>
        
        {formData.isForSale && (
          <div className={styles.field}>
            <label className={styles.label}>
              Price (ETH)
              <InfoTooltip text="Set your asking price in ETH. You can price as low as 0.00001 ETH for accessible art." />
            </label>
            <div className={styles.priceInputWrapper}>
              <input
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty, or valid decimal with max 5 decimal places
                  if (value === '' || /^\d*\.?\d{0,5}$/.test(value)) {
                    setFormData(prev => ({ ...prev, price: value }));
                  }
                }}
                placeholder="0.01"
                className={styles.input}
              />
              {formData.price && convertEthToUsd(formData.price) && (
                <span className={styles.usdConversion}>
                  {convertEthToUsd(formData.price)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>
            Royalty %
            <InfoTooltip text="Percentage you earn from future resales (0-10%). Industry standard is 5-10%." />
          </label>
          <input
            type="number"
            value={formData.royaltyPercentage}
            onChange={(e) => setFormData(prev => ({ ...prev, royaltyPercentage: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) }))}
            className={styles.input}
            min="0"
            max="10"
          />
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Editions
            <InfoTooltip text="How many copies of this artwork exist. Use 1 for a unique 1/1 piece, or more for a limited series." />
          </label>
          <input
            type="number"
            value={formData.totalEditions}
            onChange={(e) => {
              const total = Math.max(1, parseInt(e.target.value) || 1);
              setFormData(prev => ({ 
                ...prev, 
                totalEditions: total,
                editionNumber: Math.min(prev.editionNumber, total)
              }));
            }}
            className={styles.input}
            min="1"
            placeholder="1"
          />
          {formData.totalEditions === 1 && (
            <span className={styles.editionHint}>Unique 1/1</span>
          )}
          {formData.totalEditions > 1 && (
            <span className={styles.editionHint}>Limited edition of {formData.totalEditions}</span>
          )}
        </div>
      </div>
      
      <div className={styles.categoriesSection}>
        <h3 className={styles.sectionTitle}>
          Category
          <InfoTooltip text="Select the category that best describes your artwork. This helps collectors discover your work in the gallery." />
        </h3>

        <div className={styles.categoryGrid}>
          {categoriesLoading ? (
            <span className={styles.loadingText}>Loading categories...</span>
          ) : (
            availableCategories.map((cat: Category) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryChip} ${isSelected ? styles.categorySelected : ''}`}
                  onClick={() => selectCategory(cat.id)}
                  style={isSelected && cat.color ? {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                    color: '#fff'
                  } : cat.color ? {
                    borderColor: cat.color,
                  } : undefined}
                >
                  {cat.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.attributesSection}>
        <h3 className={styles.sectionTitle}>
          Attributes
          <InfoTooltip text="Optional traits that describe your artwork (e.g., Color: Blue, Style: Abstract). These appear on marketplaces and help collectors filter." />
        </h3>
        
        {formData.attributes.length > 0 && (
          <div className={styles.attributesList}>
            {formData.attributes.map((attr, index) => (
              <div key={index} className={styles.attributeTag}>
                <span>{attr.trait_type}: {attr.value}</span>
                <button 
                  type="button" 
                  onClick={() => removeAttribute(index)}
                  className={styles.removeAttr}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className={styles.addAttribute}>
          <input
            type="text"
            value={newAttribute.trait_type}
            onChange={(e) => setNewAttribute(prev => ({ ...prev, trait_type: e.target.value }))}
            placeholder="Trait (e.g., Color)"
            className={styles.input}
          />
          <input
            type="text"
            value={newAttribute.value}
            onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
            placeholder="Value (e.g., Blue)"
            className={styles.input}
          />
          <button type="button" onClick={addAttribute} className={styles.addButton}>
            Add
          </button>
        </div>
      </div>
      
      {(error || txError) && (
        <p className={styles.error}>{error || txError?.message}</p>
      )}
      
      {uploadProgress && (
        <p className={styles.progress}>{uploadProgress}</p>
      )}
      
      <button
        type="submit"
        disabled={isPending || isConfirming || isUploading}
        className={styles.submitButton}
      >
        {isUploading ? uploadProgress : isPending ? 'Confirm in wallet...' : isConfirming ? 'Minting...' : 'Mint Artwork'}
      </button>
    </form>
  );
}
