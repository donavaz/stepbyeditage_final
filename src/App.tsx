import React, { useState, useRef, useEffect } from 'react';
import { VideoPanel } from './components/VideoPanel';
import { TrackPanel } from './components/TrackPanel';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { TranscriptionProgress } from './components/TranscriptionProgress';
import { TranslationModal } from './components/TranslationModal';
import { parseSubtitleFile } from './utils/subtitleParser';
import { createEmptyCaption, splitCaption, mergeCaptions } from './utils/captionUtils';
import { exportCaptions } from './utils/exportUtils';
import { PX_PER_SECOND } from './utils/constants';
import { transcribeVideo, convertToSRT } from './services/assemblyAI';
import { translateCaptions } from './services/translationService';
import type { Caption, Track, Settings, ExportFormat } from './types';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { PanelResizer } from './components/PanelResizer';

function App() {
  const [video, setVideo] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<Caption | null>(null);
  const [selectedCaptions, setSelectedCaptions] = useState<Caption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [pendingCaptionFile, setPendingCaptionFile] = useState<{ file: File; trackNumber: number } | null>(null);
  const [settings, setSettings] = useState<Settings>({
    assemblyAiKey: '',
    deeplKey: '',
    deeplPlan: 'pro',
    showCaptionsInFullscreen: true,
    autosaveInterval: 30
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Default to 50% width
  const [transcriptionProgress, setTranscriptionProgress] = useState<{
    isProcessing: boolean;
    progress: number;
    message: string;
  }>({
    isProcessing: false,
    progress: 0,
    message: '',
  });
  const [translationProgress, setTranslationProgress] = useState<{
    isProcessing: boolean;
    progress: number;
    message: string;
    targetLang?: string;
  }>({
    isProcessing: false,
    progress: 0,
    message: '',
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackBodyRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.addEventListener('loadedmetadata', () => setDuration(video.duration));
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('loadedmetadata', () => setDuration(video.duration));
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [video]);

  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;
    videoRef.current.play();
  }, [isPlaying]);

  // Handle hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore key events when editing
      if (isEditing && e.code !== 'Escape') return;
      
      // Play/Pause - Spacebar (only when not editing)
      if (e.code === 'Space' && !isEditing) {
        e.preventDefault();
        handlePlayPause();
      }
      
      // Next caption - Tab
      if (e.code === 'Tab' && !e.shiftKey && !isEditing) {
        e.preventDefault();
        navigateCaption('next');
      }
      
      // Previous caption - Shift+Tab
      if (e.code === 'Tab' && e.shiftKey && !isEditing) {
        e.preventDefault();
        navigateCaption('prev');
      }
      
      // Exit edit mode - Escape
      if (e.code === 'Escape' && isEditing) {
        e.preventDefault();
        setIsEditing(false);
        // Find the active element and blur it
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
      
      // Fullscreen - Alt+Enter
      if (e.code === 'Enter' && e.altKey) {
        e.preventDefault();
        handleToggleFullscreen();
      }
      
      // Split captions - Ctrl/Cmd + 2/3/4
      if ((e.ctrlKey || e.metaKey) && selectedCaption && !isEditing) {
        if (e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          handleSplitCaption(selectedCaption, 2);
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          handleSplitCaption(selectedCaption, 3);
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          handleSplitCaption(selectedCaption, 4);
        }
      }
      
      // Merge captions - Ctrl/Cmd + M
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyM' && selectedCaptions.length > 1 && !isEditing) {
        e.preventDefault();
        handleMergeCaptions();
      }
      
      // Delete captions - Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCaptions.length > 0 && !isEditing) {
        e.preventDefault();
        handleDeleteCaptions();
      }
      
      // Undo - Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !isEditing) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isEditing, isPlaying, selectedCaption, selectedCaptions, historyIndex]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update selectedCaption when it changes in tracks
  useEffect(() => {
    if (selectedCaption) {
      // Find the updated version of the selected caption
      const updatedCaption = tracks
        .flatMap(track => track.captions)
        .find(cap => cap.id === selectedCaption.id);
      
      if (updatedCaption && 
          (updatedCaption.start !== selectedCaption.start || 
           updatedCaption.end !== selectedCaption.end || 
           updatedCaption.text !== selectedCaption.text)) {
        setSelectedCaption(updatedCaption);
      }
    }
    
    // Update selected captions array
    if (selectedCaptions.length > 0) {
      const updatedCaptions = selectedCaptions
        .map(caption => {
          return tracks
            .flatMap(track => track.captions)
            .find(cap => cap.id === caption.id);
        })
        .filter(caption => caption !== undefined) as Caption[];
      
      if (updatedCaptions.length !== selectedCaptions.length) {
        setSelectedCaptions(updatedCaptions);
      }
    }
  }, [tracks, selectedCaption, selectedCaptions]);

  // Add to history when tracks change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only add to history if there are tracks
    if (tracks.length > 0) {
      // Clone tracks deeply
      const tracksCopy = JSON.parse(JSON.stringify(tracks));
      
      // Remove any history entries after the current index
      const newHistory = history.slice(0, historyIndex + 1);
      
      // Add the new state to history
      setHistory([...newHistory, tracksCopy]);
      setHistoryIndex(newHistory.length);
    }
  }, [tracks]);

  const handleVideoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideo(url);
    setVideoName(file.name);
    setVideoFile(file);
  };

  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const navigateCaption = (direction: 'next' | 'prev') => {
    if (!selectedCaption || tracks.length === 0) return;
    
    // Get all visible captions across all tracks, sorted by start time
    const allCaptions = tracks
      .filter(track => track.visible)
      .flatMap(track => track.captions)
      .sort((a, b) => a.start - b.start);
    
    if (allCaptions.length === 0) return;
    
    // Find current index
    const currentIndex = allCaptions.findIndex(c => c.id === selectedCaption.id);
    if (currentIndex === -1) return;
    
    // Calculate new index
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allCaptions.length;
    } else {
      newIndex = (currentIndex - 1 + allCaptions.length) % allCaptions.length;
    }
    
    // Select the new caption
    handleCaptionSelect(allCaptions[newIndex]);
  };

  const handleCaptionUpload = async (file: File, trackNumber: number) => {
    setPendingCaptionFile({ file, trackNumber });
    setShowLanguageSelector(true);
  };

  const handleCreateBlankTrack = () => {
    setShowLanguageSelector(true);
    setPendingCaptionFile(null);
  };

  const handleCloseProject = () => {
    setVideo(null);
    setVideoName(null);
    setVideoFile(null);
    setTracks([]);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSelectedCaption(null);
    setSelectedCaptions([]);
    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleRemoveTrack = (trackId: number) => {
    setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
    if (selectedCaption && selectedCaption.track === trackId) {
      setSelectedCaption(null);
    }
    setSelectedCaptions(prev => prev.filter(caption => caption.track !== trackId));
  };

  const handleLanguageSelect = async (language: string) => {
    if (pendingCaptionFile) {
      const { file, trackNumber } = pendingCaptionFile;
      const text = await file.text();
      const parsedCaptions = parseSubtitleFile(text).map(caption => ({
        ...caption,
        id: uuidv4(),
        track: trackNumber
      }));

      const newTrack: Track = {
        id: trackNumber,
        name: file.name.replace(/\.[^/.]+$/, ""),
        language,
        captions: parsedCaptions,
        visible: true,
        fontStyle: {
          fontFamily: 'Arial',
          fontSize: 14
        }
      };

      setTracks(prevTracks => {
        const existingTrackIndex = prevTracks.findIndex(t => t.id === trackNumber);
        if (existingTrackIndex >= 0) {
          const updatedTracks = [...prevTracks];
          updatedTracks[existingTrackIndex] = newTrack;
          return updatedTracks;
        }
        return [...prevTracks, newTrack];
      });
    } else {
      // Create a blank track
      const trackId = Date.now();
      const blankTrack: Track = {
        id: trackId,
        name: `Track ${tracks.length + 1}`,
        language,
        captions: [],
        visible: true,
        fontStyle: {
          fontFamily: 'Arial',
          fontSize: 14
        }
      };
      
      setTracks(prevTracks => [...prevTracks, blankTrack]);
    }

    setShowLanguageSelector(false);
    setPendingCaptionFile(null);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentVideoTime = videoRef.current.currentTime;
    setCurrentTime(currentVideoTime);
    
    // Auto-scroll the right panel based on current time
    if (rightPanelRef.current) {
      const panel = rightPanelRef.current;
      const panelRect = panel.getBoundingClientRect();
      const panelHeight = panelRect.height;
      const footerHeight = 80; // Approximate height of the Controls component
      
      // Calculate the target scroll position
      const targetPosition = currentVideoTime * PX_PER_SECOND;
      const currentScrollTop = panel.scrollTop;
      
      // Calculate the visible range in the panel
      const visibleStart = currentScrollTop;
      const visibleEnd = currentScrollTop + panelHeight - footerHeight;
      
      // Calculate the buffer zones (20% of panel height)
      const bufferZone = panelHeight * 0.2;
      const lowerBufferThreshold = visibleEnd - bufferZone;
      
      // Check if we need to scroll
      if (targetPosition > lowerBufferThreshold) {
        const newScrollTop = targetPosition - (panelHeight - footerHeight) + bufferZone;
        
        // Only scroll if we're not already scrolling or if the scroll position has changed significantly
        if (!isAutoScrolling || Math.abs(newScrollTop - lastScrollTopRef.current) > 10) {
          setIsAutoScrolling(true);
          lastScrollTopRef.current = newScrollTop;
          
          panel.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
          
          // Reset the auto-scrolling flag after animation
          setTimeout(() => setIsAutoScrolling(false), 100);
        }
      }
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCaptionSelect = (caption: Caption) => {
    setSelectedCaption(caption);
    setSelectedCaptions([caption]);
    if (videoRef.current) {
      videoRef.current.currentTime = caption.start;
      setCurrentTime(caption.start);
    }
  };

  const handleCaptionMultiSelect = (caption: Caption, append: boolean) => {
    if (append) {
      // Add to selection if not already selected, otherwise remove it
      setSelectedCaptions(prev => {
        const isAlreadySelected = prev.some(c => c.id === caption.id);
        if (isAlreadySelected) {
          return prev.filter(c => c.id !== caption.id);
        } else {
          return [...prev, caption];
        }
      });
      
      // Update the primary selected caption
      if (selectedCaptions.length === 0 || !selectedCaption) {
        setSelectedCaption(caption);
      }
    } else {
      // Single selection
      setSelectedCaption(caption);
      setSelectedCaptions([caption]);
      if (videoRef.current) {
        videoRef.current.currentTime = caption.start;
        setCurrentTime(caption.start);
      }
    }
  };

  const handleTimeChange = (caption: Caption, start: number, end: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        captions: track.captions.map(cap => 
          cap.id === caption.id ? { ...cap, start, end } : cap
        )
      }))
    );
    
    // If this is the selected caption, update the video position
    if (selectedCaption && selectedCaption.id === caption.id) {
      // Only update video position if start time has changed
      if (selectedCaption.start !== start && videoRef.current) {
        videoRef.current.currentTime = start;
        setCurrentTime(start);
      }
    }
  };

  const handleCaptionTextChange = (caption: Caption, text: string) => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        captions: track.captions.map(cap => 
          cap.id === caption.id ? { ...cap, text } : cap
        )
      }))
    );
  };

  const handleToggleTrackVisibility = (trackId: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId ? { ...track, visible: !track.visible } : track
      )
    );
  };

  const handleMoveTrack = (trackId: number, direction: 'up' | 'down') => {
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;
    
    const newTracks = [...tracks];
    
    if (direction === 'up' && trackIndex > 0) {
      // Swap with the track above
      [newTracks[trackIndex], newTracks[trackIndex - 1]] = [newTracks[trackIndex - 1], newTracks[trackIndex]];
    } else if (direction === 'down' && trackIndex < tracks.length - 1) {
      // Swap with the track below
      [newTracks[trackIndex], newTracks[trackIndex + 1]] = [newTracks[trackIndex + 1], newTracks[trackIndex]];
    }
    
    setTracks(newTracks);
  };

  const handleFontStyleChange = (trackId: number, fontStyle: { fontFamily: string; fontSize: number }) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId ? { ...track, fontStyle } : track
      )
    );
  };

  const handleExport = (format: ExportFormat, options?: any) => {
    try {
      exportCaptions(tracks, format, options);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAutoTranscribe = async () => {
    if (!videoFile || !settings.assemblyAiKey) {
      setShowSettings(true);
      return;
    }

    try {
      // Start the transcription process
      setTranscriptionProgress({
        isProcessing: true,
        progress: 0,
        message: 'Preparing video for transcription',
      });

      console.log("Starting transcription with API key:", settings.assemblyAiKey.substring(0, 5) + "...");
      console.log("Video file:", videoFile.name, videoFile.type, videoFile.size);

      // Send video directly to AssemblyAI for transcription
      const result = await transcribeVideo(
        videoFile, 
        settings.assemblyAiKey,
        (progress) => {
          setTranscriptionProgress({
            isProcessing: true,
            progress,
            message: progress < 40 ? 'Uploading video' : 
                     progress < 95 ? 'Processing transcription' : 'Finalizing',
          });
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Convert the result to SRT format
      const srtContent = convertToSRT(result);
      
      // Create a track with the transcription
      const trackNumber = Date.now();
      
      // Parse the SRT content
      const parsedCaptions = parseSubtitleFile(srtContent).map(caption => ({
        ...caption,
        id: uuidv4(),
        track: trackNumber
      }));

      // Create a new track
      const newTrack: Track = {
        id: trackNumber,
        name: `${videoName?.replace(/\.[^/.]+$/, "") || 'Transcription'}`,
        language: 'en', // Default to English
        captions: parsedCaptions,
        visible: true,
        fontStyle: {
          fontFamily: 'Arial',
          fontSize: 14
        }
      };

      setTracks([newTrack]);
      
      // Clear the transcription progress
      setTranscriptionProgress({
        isProcessing: false,
        progress: 0,
        message: '',
      });

    } catch (error) {
      console.error('Transcription error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Transcription failed: ${errorMessage}`);
      
      setTranscriptionProgress({
        isProcessing: false,
        progress: 0,
        message: '',
      });
    }
  };

  const handleAutoTranslate = async () => {
    // Check if we have visible tracks with captions
    const visibleTracks = tracks.filter(track => track.visible);
    if (visibleTracks.length === 0) {
      alert('Please add a caption track first');
      return;
    }
    
    const hasVisibleCaptions = visibleTracks.some(track => track.captions.length > 0);
    if (!hasVisibleCaptions) {
      alert('Please add captions to a track first');
      return;
    }

    // Check if DeepL API key is set
    if (!settings.deeplKey) {
      alert('Please set your DeepL API key in Settings');
      setShowSettings(true);
      return;
    }

    // Find the first visible track with captions
    const sourceTrack = visibleTracks.find(track => track.captions.length > 0);
    if (!sourceTrack) return;
    
    // Open the translation modal to let the user select a target language
    setShowTranslationModal(true);
  };

  const handleStartTranslation = async (targetLang: string) => {
    // Close the translation modal
    setShowTranslationModal(false);
    
    try {
      // Find the first visible track with captions to translate
      const visibleTracks = tracks.filter(track => track.visible);
      const sourceTrack = visibleTracks.find(track => track.captions.length > 0);
      if (!sourceTrack) {
        throw new Error('No visible track with captions found');
      }
      
      // Start the translation process
      setTranslationProgress({
        isProcessing: true,
        progress: 0,
        message: 'Initializing translation',
        targetLang
      });
      
      // Translate the captions
      const newTrack = await translateCaptions(
        sourceTrack.captions,
        sourceTrack,
        targetLang,
        settings.deeplKey || '',
        settings.deeplPlan || 'pro',
        (progress) => {
          setTranslationProgress({
            isProcessing: true,
            progress,
            message: progress < 95 ? 'Translating captions' : 'Finalizing',
            targetLang
          });
        }
      );
      
      // Add the new track to the tracks array
      setTracks(prevTracks => [...prevTracks, newTrack]);
      
      // Clear the translation progress
      setTranslationProgress({
        isProcessing: false,
        progress: 0,
        message: ''
      });
      
    } catch (error) {
      console.error('Translation error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Translation failed: ${errorMessage}`);
      
      setTranslationProgress({
        isProcessing: false,
        progress: 0,
        message: ''
      });
    }
  };

  const handleCancelTranscription = () => {
    setTranscriptionProgress({
      isProcessing: false,
      progress: 0,
      message: '',
    });
  };

  const handleCancelTranslation = () => {
    setTranslationProgress({
      isProcessing: false,
      progress: 0,
      message: '',
    });
  };

  // Split caption handling
  const handleSplitCaption = (caption: Caption, parts: 2 | 3 | 4) => {
    try {
      if (!caption) return;
      
      // Create new captions
      const newCaptions = splitCaption(caption, parts);
      
      // Update the track with new captions
      setTracks(prevTracks => 
        prevTracks.map(track => {
          if (track.id === caption.track) {
            // Remove the original caption and add the new ones
            const filteredCaptions = track.captions.filter(c => c.id !== caption.id);
            return {
              ...track,
              captions: [...filteredCaptions, ...newCaptions].sort((a, b) => a.start - b.start)
            };
          }
          return track;
        })
      );
      
      // Select the first new caption
      if (newCaptions.length > 0) {
        handleCaptionSelect(newCaptions[0]);
      }
    } catch (error) {
      console.error('Error splitting caption:', error);
      alert(`Failed to split caption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Merge captions handling
  const handleMergeCaptions = () => {
    try {
      if (selectedCaptions.length < 2) {
        alert('Select at least 2 captions to merge');
        return;
      }
      
      // Check if all captions are from the same track
      const trackId = selectedCaptions[0].track;
      if (!selectedCaptions.every(c => c.track === trackId)) {
        alert('Can only merge captions from the same track');
        return;
      }
      
      // Create a merged caption
      const mergedCaption = mergeCaptions(selectedCaptions);
      if (!mergedCaption) {
        alert('Failed to merge captions');
        return;
      }
      
      // Update the track with the merged caption
      setTracks(prevTracks => 
        prevTracks.map(track => {
          if (track.id === trackId) {
            // Remove the original captions and add the merged one
            const captionIds = selectedCaptions.map(c => c.id);
            const filteredCaptions = track.captions.filter(c => !captionIds.includes(c.id));
            return {
              ...track,
              captions: [...filteredCaptions, mergedCaption].sort((a, b) => a.start - b.start)
            };
          }
          return track;
        })
      );
      
      // Select the merged caption
      handleCaptionSelect(mergedCaption);
    } catch (error) {
      console.error('Error merging captions:', error);
      alert(`Failed to merge captions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete selected captions
  const handleDeleteCaptions = () => {
    if (selectedCaptions.length === 0) return;
    
    try {
      // Group captions by track to optimize the update
      const captionsByTrack: Record<number, string[]> = {};
      selectedCaptions.forEach(caption => {
        if (!captionsByTrack[caption.track]) {
          captionsByTrack[caption.track] = [];
        }
        captionsByTrack[caption.track].push(caption.id);
      });
      
      // Update tracks removing the selected captions
      setTracks(prevTracks => 
        prevTracks.map(track => {
          if (captionsByTrack[track.id]) {
            return {
              ...track,
              captions: track.captions.filter(caption => 
                !captionsByTrack[track.id].includes(caption.id)
              )
            };
          }
          return track;
        })
      );
      
      // Clear selection
      setSelectedCaption(null);
      setSelectedCaptions([]);
    } catch (error) {
      console.error('Error deleting captions:', error);
      alert(`Failed to delete captions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (historyIndex <= 0) {
      alert('Nothing to undo');
      return;
    }
    
    try {
      // Get the previous state
      const previousState = history[historyIndex - 1];
      if (!previousState) return;
      
      // Temporarily disable history recording to avoid recording the undo itself
      isInitialMount.current = true;
      
      // Restore the previous state
      setTracks(previousState);
      setHistoryIndex(historyIndex - 1);
      
      // Re-enable history recording after a short delay
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    } catch (error) {
      console.error('Error during undo:', error);
      alert(`Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get the list of visible track IDs
  const visibleTrackIds = tracks
    .filter(track => track.visible)
    .map(track => track.id);

  // Get active captions based on current time
  const activeCaptions = tracks
    .filter(track => track.visible)
    .flatMap(track => track.captions)
    .filter(caption => currentTime >= caption.start && currentTime <= caption.end);

  // Check if auto-transcribe should be enabled
  const isAutoTranscribeEnabled = videoFile !== null && tracks.length === 0;

  // Check if split/merge should be enabled
  const canSplit = selectedCaption !== null && selectedCaptions.length === 1;
  const canMerge = selectedCaptions.length >= 2 && selectedCaptions.every(c => c.track === selectedCaptions[0].track);
  const canDelete = selectedCaptions.length > 0;
  const canUndo = historyIndex > 0;

  // Handle panel resizer
  const handlePanelResize = (newLeftWidthPercentage: number) => {
    setLeftPanelWidth(newLeftWidthPercentage);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header 
        onVideoUpload={handleVideoUpload}
        onCaptionUpload={handleCaptionUpload}
        onCreateBlankTrack={handleCreateBlankTrack}
        onAutoTranscribe={handleAutoTranscribe}
        onAutoTranslate={handleAutoTranslate}
        onSettingsClick={() => setShowSettings(true)}
        onSplitCaption={(parts) => selectedCaption && handleSplitCaption(selectedCaption, parts)}
        onMergeCaptions={handleMergeCaptions}
        onDeleteCaptions={handleDeleteCaptions}
        onUndo={handleUndo}
        isAutoTranscribeEnabled={isAutoTranscribeEnabled}
        canSplit={canSplit}
        canMerge={canMerge}
        canDelete={canDelete}
        canUndo={canUndo}
      />

      <main className="flex-1 flex overflow-hidden">
        <div 
          className="bg-gray-900 overflow-hidden" 
          ref={videoContainerRef}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <VideoPanel
            videoRef={videoRef}
            videoUrl={video}
            videoName={videoName}
            captions={tracks.flatMap(t => t.captions)}
            currentTime={currentTime}
            visibleTracks={visibleTrackIds}
            onVideoUpload={handleVideoUpload}
            onCloseProject={handleCloseProject}
            isFullscreen={isFullscreen}
            activeCaptions={activeCaptions}
          />
        </div>

        {/* Panel Resizer */}
        <PanelResizer 
          onResize={handlePanelResize}
          initialLeftWidth={leftPanelWidth}
          minLeftWidth={20}
          maxLeftWidth={80}
        />

        <div 
          className="overflow-hidden" 
          ref={rightPanelRef}
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <TrackPanel
            tracks={tracks}
            currentTime={currentTime}
            duration={duration}
            selectedCaption={selectedCaption}
            selectedCaptions={selectedCaptions}
            onCaptionSelect={handleCaptionSelect}
            onCaptionMultiSelect={handleCaptionMultiSelect}
            onEditStart={() => setIsEditing(true)}
            onEditEnd={() => setIsEditing(false)}
            onTimeChange={handleTimeChange}
            onToggleTrackVisibility={handleToggleTrackVisibility}
            onMoveTrack={handleMoveTrack}
            onRemoveTrack={handleRemoveTrack}
            onCreateBlankTrack={handleCreateBlankTrack}
            onCaptionUpload={handleCaptionUpload}
            trackBodyRef={trackBodyRef}
            onCaptionTextChange={handleCaptionTextChange}
            onFontStyleChange={handleFontStyleChange}
            onSplitCaption={handleSplitCaption}
            onMergeCaptions={handleMergeCaptions}
            onDeleteCaptions={handleDeleteCaptions}
          />
        </div>
      </main>

      <Controls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        selectedCaption={selectedCaption}
        onPlayPause={handlePlayPause}
        onSeek={(time) => {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
          }
        }}
        onExport={() => setShowExportModal(true)}
        onFullscreen={handleToggleFullscreen}
        onCaptionTimeChange={handleTimeChange}
      />

      {showLanguageSelector && (
        <LanguageSelector
          onLanguageSelect={handleLanguageSelect}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={setSettings}
        />
      )}

      {showExportModal && (
        <ExportModal
          tracks={tracks}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}

      {showTranslationModal && (
        <TranslationModal
          onClose={() => setShowTranslationModal(false)}
          onTranslate={handleStartTranslation}
          sourceLang={tracks.find(t => t.visible && t.captions.length > 0)?.language}
        />
      )}

      {transcriptionProgress.isProcessing && (
        <TranscriptionProgress
          progress={transcriptionProgress.progress}
          message={transcriptionProgress.message}
          onCancel={handleCancelTranscription}
        />
      )}

      {translationProgress.isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Translating to {translationProgress.targetLang?.toUpperCase()}</h2>
              <button onClick={handleCancelTranslation} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${translationProgress.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-sm text-gray-600">
                <span>{translationProgress.progress}%</span>
                <span>{translationProgress.message}</span>
              </div>
            </div>
            
            <p className="mb-4 text-gray-600 text-sm">
              Your captions are being translated using the DeepL API via Supabase Edge Functions.
              <br /><br />
              Please keep this window open until the process completes.
            </p>
            
            <div className="flex justify-end">
              <button
                onClick={handleCancelTranslation}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;