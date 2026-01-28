'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useMintArtwork, useArtistProfile } from '../../hooks/useContract';
import { uploadFileToIPFS, uploadMetadataToIPFS, validateArtworkFile, createArtworkMetadata } from '../../services/ipfs';
import { MintFormData } from '../../types';
import styles from './MintForm.module.css';

interface MintFormProps {
  onSuccess?: (tokenId: string) => void;
}

export function MintForm({ onSuccess: _onSuccess }: MintFormProps) {
  const { address } = useAccount();
  const { data: artistProfile } = useArtistProfile(address);
  
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
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  
  const { mint, isPending, isConfirming, isSuccess, hash, error: txError } = useMintArtwork();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
        formData.attributes
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
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        <h2>Artwork Minted!</h2>
        <p>{formData.title} has been successfully minted.</p>
        <a 
          href={`https://basescan.org/tx/${hash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.txLink}
        >
          View transaction
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Mint New Artwork</h2>
      
      <div className={styles.uploadSection}>
        <label className={styles.uploadLabel}>
          {previewUrl ? (
            <div className={styles.previewContainer}>
              {mediaType.startsWith('video') ? (
                <video src={previewUrl} className={styles.preview} muted loop autoPlay />
              ) : (
                <img src={previewUrl} alt="Preview" className={styles.preview} />
              )}
              <span className={styles.changeText}>Click to change</span>
            </div>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>Upload Artwork</span>
              <span className={styles.fileTypes}>JPG, PNG, GIF (max 50MB)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </label>
      </div>
      
      <div className={styles.field}>
        <label className={styles.label}>Title *</label>
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
        <label className={styles.label}>Description</label>
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
          </label>
        </div>
        
        {formData.isForSale && (
          <div className={styles.field}>
            <label className={styles.label}>Price (ETH)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.1"
              className={styles.input}
              min="0"
              step="0.001"
            />
          </div>
        )}
      </div>
      
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Royalty %</label>
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
          <label className={styles.label}>Edition</label>
          <div className={styles.editionInputs}>
            <input
              type="number"
              value={formData.editionNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, editionNumber: parseInt(e.target.value) || 1 }))}
              className={styles.input}
              min="1"
            />
            <span>/</span>
            <input
              type="number"
              value={formData.totalEditions}
              onChange={(e) => setFormData(prev => ({ ...prev, totalEditions: parseInt(e.target.value) || 1 }))}
              className={styles.input}
              min="1"
            />
          </div>
        </div>
      </div>
      
      <div className={styles.attributesSection}>
        <h3 className={styles.sectionTitle}>Attributes</h3>
        
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
