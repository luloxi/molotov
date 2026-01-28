'use client';

import { useState, useCallback } from 'react';
import { useRegisterArtist } from '../../hooks/useContract';
import { uploadFileToIPFS, validateArtworkFile } from '../../services/ipfs';
import { ArtistFormData, SocialLinks } from '../../types';
import styles from './RegisterArtistForm.module.css';

interface RegisterArtistFormProps {
  onSuccess?: () => void;
}

export function RegisterArtistForm({ onSuccess }: RegisterArtistFormProps) {
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    bio: '',
    profileImage: null,
    socialLinks: {},
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, isPending, isConfirming, isSuccess, error: txError } = useRegisterArtist();

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateArtworkFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setFormData(prev => ({ ...prev, profileImage: file }));
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleSocialChange = (key: keyof SocialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value || undefined },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      setIsUploading(true);
      
      let profileImageHash = '';
      if (formData.profileImage) {
        const uploadResult = await uploadFileToIPFS(formData.profileImage);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        profileImageHash = uploadResult.hash || '';
      }
      
      const socialLinksJson = JSON.stringify(formData.socialLinks);
      
      register(formData.name, formData.bio, profileImageHash, socialLinksJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsUploading(false);
    }
  };

  if (isSuccess) {
    onSuccess?.();
    return (
      <div className={styles.success}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        <h2>Welcome, {formData.name}!</h2>
        <p>You are now registered as an artist on Molotov Gallery.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Become an Artist</h2>
      <p className={styles.subtitle}>Register your profile to start minting artworks</p>
      
      <div className={styles.imageUpload}>
        <label className={styles.imageLabel}>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className={styles.preview} />
          ) : (
            <div className={styles.placeholder}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>Add Profile Photo</span>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleImageChange}
            className={styles.fileInput}
          />
        </label>
      </div>
      
      <div className={styles.field}>
        <label className={styles.label}>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Your artist name"
          className={styles.input}
          required
        />
      </div>
      
      <div className={styles.field}>
        <label className={styles.label}>Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about yourself and your art..."
          className={styles.textarea}
          rows={4}
        />
      </div>
      
      <div className={styles.socialSection}>
        <h3 className={styles.socialTitle}>Social Links</h3>
        
        <div className={styles.field}>
          <label className={styles.label}>Twitter/X</label>
          <div className={styles.socialInput}>
            <span className={styles.socialPrefix}>@</span>
            <input
              type="text"
              value={formData.socialLinks.twitter || ''}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
              placeholder="username"
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>Instagram</label>
          <div className={styles.socialInput}>
            <span className={styles.socialPrefix}>@</span>
            <input
              type="text"
              value={formData.socialLinks.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="username"
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>Farcaster</label>
          <div className={styles.socialInput}>
            <span className={styles.socialPrefix}>@</span>
            <input
              type="text"
              value={formData.socialLinks.farcaster || ''}
              onChange={(e) => handleSocialChange('farcaster', e.target.value)}
              placeholder="username"
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.field}>
          <label className={styles.label}>Website</label>
          <input
            type="url"
            value={formData.socialLinks.website || ''}
            onChange={(e) => handleSocialChange('website', e.target.value)}
            placeholder="https://yoursite.com"
            className={styles.input}
          />
        </div>
      </div>
      
      {(error || txError) && (
        <p className={styles.error}>{error || txError?.message}</p>
      )}
      
      <button
        type="submit"
        disabled={isPending || isConfirming || isUploading}
        className={styles.submitButton}
      >
        {isUploading ? 'Uploading...' : isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Register as Artist'}
      </button>
    </form>
  );
}
