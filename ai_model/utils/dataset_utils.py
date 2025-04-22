import os
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
import librosa
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
import json
import requests
from tqdm import tqdm
import glob
import random
import soundfile as sf
from ai_model.utils.audio_utils import AudioProcessor

class AudioDataset(Dataset):
    """
    PyTorch Dataset for loading audio files and their features.
    """
    def __init__(
        self, 
        audio_files: List[str], 
        target_files: Optional[List[str]] = None,
        feature_list: Optional[pd.DataFrame] = None,
        transform=None, 
        sr: int = 22050, 
        duration: Optional[float] = None,
        segment_length: int = 22050 * 5,  # 5 second segments
        augment: bool = False
    ):
        """
        Initialize the dataset.
        
        Args:
            audio_files (List[str]): List of audio file paths
            target_files (Optional[List[str]]): List of target (lofi) audio file paths
            feature_list (Optional[pd.DataFrame]): DataFrame with precomputed features
            transform: Optional transforms to apply
            sr (int): Sample rate
            duration (Optional[float]): Duration to load for each audio file (in seconds)
            segment_length (int): Length of audio segments in samples
            augment (bool): Whether to apply data augmentation
        """
        self.audio_files = audio_files
        self.target_files = target_files
        self.feature_list = feature_list
        self.transform = transform
        self.sr = sr
        self.duration = duration
        self.segment_length = segment_length
        self.augment = augment
        self.audio_processor = AudioProcessor(sr=sr)
        
    def __len__(self) -> int:
        return len(self.audio_files)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        # Load audio
        audio_path = self.audio_files[idx]
        audio, _ = self.audio_processor.load_audio(audio_path)
        
        # Cut or pad to segment length
        if len(audio) > self.segment_length:
            # Random offset if augmenting, otherwise take the beginning
            if self.augment:
                max_offset = len(audio) - self.segment_length
                offset = np.random.randint(0, max_offset)
            else:
                offset = 0
            audio = audio[offset:offset + self.segment_length]
        else:
            # Pad with zeros
            padding = self.segment_length - len(audio)
            audio = np.pad(audio, (0, padding))
        
        # Apply augmentation if needed
        if self.augment:
            # Random pitch shift (-2 to +2 semitones)
            if random.random() < 0.5:
                audio = self.audio_processor.apply_pitch_shifting(
                    audio, self.sr, steps=random.uniform(-2, 2)
                )
            
            # Random time stretching (0.9x to 1.1x)
            if random.random() < 0.5:
                audio = self.audio_processor.apply_time_stretching(
                    audio, self.sr, rate=random.uniform(0.9, 1.1)
                )
        
        # Convert to tensor
        audio_tensor = torch.FloatTensor(audio)
        
        # Get target if available
        result = {'audio': audio_tensor}
        
        if self.target_files is not None:
            target_path = self.target_files[idx]
            target, _ = self.audio_processor.load_audio(target_path)
            
            # Ensure target is same length as input
            if len(target) > self.segment_length:
                target = target[:self.segment_length]
            else:
                padding = self.segment_length - len(target)
                target = np.pad(target, (0, padding))
                
            target_tensor = torch.FloatTensor(target)
            result['target'] = target_tensor
            
        # Add features if available
        if self.feature_list is not None:
            features = self.feature_list.iloc[idx].values
            result['features'] = torch.FloatTensor(features)
            
        return result

class DatasetManager:
    """
    Class to manage audio datasets, including downloading, preprocessing, and loading.
    """
    def __init__(self, data_dir: str, cache_dir: str = "cache"):
        """
        Initialize the dataset manager.
        
        Args:
            data_dir (str): Directory for dataset storage
            cache_dir (str): Directory for cache files
        """
        self.data_dir = data_dir
        self.cache_dir = cache_dir
        
        # Create directories if they don't exist
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(cache_dir, exist_ok=True)
        
        self.audio_processor = AudioProcessor()
        
    def download_free_music_archive(
        self, 
        genre: str = "Electronic", 
        limit: int = 100, 
        min_duration: float = 30.0,
        max_duration: float = 300.0
    ) -> List[str]:
        """
        Download audio from Free Music Archive (FMA).
        
        Args:
            genre (str): Genre to download
            limit (int): Maximum number of tracks to download
            min_duration (float): Minimum track duration in seconds
            max_duration (float): Maximum track duration in seconds
            
        Returns:
            List[str]: List of downloaded file paths
        """
        # FMA tracks metadata URL
        metadata_url = "https://os.unil.cloud.switch.ch/fma/fma_metadata.zip"
        
        # Path to save metadata
        metadata_path = os.path.join(self.cache_dir, "fma_metadata.zip")
        
        # Download metadata if it doesn't exist
        if not os.path.exists(metadata_path):
            print(f"Downloading metadata from {metadata_url}")
            response = requests.get(metadata_url, stream=True)
            with open(metadata_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
        
        # Extract and load metadata
        import zipfile
        import csv
        
        # Extract tracks.csv
        tracks_path = os.path.join(self.cache_dir, "tracks.csv")
        if not os.path.exists(tracks_path):
            with zipfile.ZipFile(metadata_path, "r") as zip_ref:
                zip_ref.extract("fma_metadata/tracks.csv", self.cache_dir)
                os.rename(
                    os.path.join(self.cache_dir, "fma_metadata/tracks.csv"),
                    tracks_path
                )
        
        # Load tracks
        tracks = pd.read_csv(tracks_path, low_memory=False)
        
        # Filter by genre and duration
        genre_tracks = tracks[tracks["track.genre_top"] == genre]
        filtered_tracks = genre_tracks[
            (genre_tracks["track.duration"] >= min_duration) &
            (genre_tracks["track.duration"] <= max_duration)
        ]
        
        # Limit the number of tracks
        selected_tracks = filtered_tracks.head(limit)
        
        # Download tracks
        downloaded_files = []
        for i, row in tqdm(selected_tracks.iterrows(), total=len(selected_tracks)):
            track_id = row["track.id"]
            
            # Create the output directory
            output_dir = os.path.join(self.data_dir, "fma", genre)
            os.makedirs(output_dir, exist_ok=True)
            
            # Output file path
            output_path = os.path.join(output_dir, f"{track_id}.mp3")
            
            # Skip if file already exists
            if os.path.exists(output_path):
                downloaded_files.append(output_path)
                continue
            
            # Construct the download URL
            # FMA uses a hierarchical structure of files
            id_str = str(track_id).zfill(6)
            download_url = f"https://os.unil.cloud.switch.ch/fma/fma_small/{id_str[:3]}/{id_str}.mp3"
            
            try:
                # Download the file
                response = requests.get(download_url, stream=True)
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        for chunk in response.iter_content(chunk_size=1024):
                            if chunk:
                                f.write(chunk)
                    downloaded_files.append(output_path)
                    print(f"Downloaded {output_path}")
                else:
                    print(f"Failed to download {download_url}: {response.status_code}")
            except Exception as e:
                print(f"Error downloading {download_url}: {e}")
        
        return downloaded_files
    
    def load_local_audio(self, directory: str, extensions: List[str] = [".mp3", ".wav"]) -> List[str]:
        """
        Load audio files from a local directory.
        
        Args:
            directory (str): Directory containing audio files
            extensions (List[str]): List of file extensions to include
            
        Returns:
            List[str]: List of audio file paths
        """
        audio_files = []
        
        for ext in extensions:
            pattern = os.path.join(directory, f"**/*{ext}")
            audio_files.extend(glob.glob(pattern, recursive=True))
        
        return audio_files
    
    def precompute_features(self, audio_files: List[str], output_path: str) -> pd.DataFrame:
        """
        Precompute features for a list of audio files and save as CSV.
        
        Args:
            audio_files (List[str]): List of audio file paths
            output_path (str): Path to save features CSV
            
        Returns:
            pd.DataFrame: DataFrame with extracted features
        """
        features_list = []
        
        for audio_path in tqdm(audio_files, desc="Extracting features"):
            try:
                # Load audio
                y, sr = self.audio_processor.load_audio(audio_path)
                
                # Extract features
                features = self.audio_processor.extract_features(y, sr)
                
                # Add file path
                features["file_path"] = audio_path
                
                features_list.append(features)
            except Exception as e:
                print(f"Error processing {audio_path}: {e}")
        
        # Convert to DataFrame
        df = pd.DataFrame(features_list)
        
        # Save to CSV
        df.to_csv(output_path, index=False)
        
        return df
    
    def create_train_test_split(
        self, 
        audio_files: List[str], 
        test_size: float = 0.2, 
        random_state: int = 42
    ) -> Tuple[List[str], List[str]]:
        """
        Split audio files into training and test sets.
        
        Args:
            audio_files (List[str]): List of audio file paths
            test_size (float): Proportion of the dataset to include in the test split
            random_state (int): Random state for reproducibility
            
        Returns:
            Tuple[List[str], List[str]]: Training and test file paths
        """
        from sklearn.model_selection import train_test_split
        
        train_files, test_files = train_test_split(
            audio_files, test_size=test_size, random_state=random_state
        )
        
        return train_files, test_files
    
    def generate_lofi_dataset(
        self, 
        source_files: List[str], 
        output_dir: str, 
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Generate lofi versions of source audio files.
        
        Args:
            source_files (List[str]): List of source audio file paths
            output_dir (str): Directory to save generated lofi files
            parameters (Optional[Dict[str, Any]]): Parameters for lofi generation (None for random)
            
        Returns:
            List[str]: List of generated lofi file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        
        generated_files = []
        
        for source_path in tqdm(source_files, desc="Generating lofi dataset"):
            try:
                # Load source audio
                y, sr = self.audio_processor.load_audio(source_path)
                
                # Get output path
                filename = os.path.basename(source_path)
                base_name, ext = os.path.splitext(filename)
                output_path = os.path.join(output_dir, f"{base_name}_lofi{ext}")
                
                # Generate parameters if not provided
                if parameters is None:
                    params = {
                        'chill_level': random.uniform(30, 90),
                        'beat_intensity': random.uniform(20, 80),
                        'vintage_effect': random.uniform(20, 80),
                        'mood': random.choice(['relaxed', 'focus', 'sleep'])
                    }
                else:
                    params = parameters
                
                # Apply lofi effects
                y_lofi = self.audio_processor.apply_lofi_effects(
                    y, sr,
                    chill_level=params['chill_level'],
                    beat_intensity=params['beat_intensity'],
                    vintage_effect=params['vintage_effect'],
                    mood=params['mood']
                )
                
                # Save lofi audio
                self.audio_processor.save_audio(y_lofi, sr, output_path)
                
                generated_files.append(output_path)
            except Exception as e:
                print(f"Error processing {source_path}: {e}")
        
        return generated_files
    
    def create_dataloaders(
        self, 
        train_files: List[str], 
        test_files: List[str], 
        train_target_files: Optional[List[str]] = None,
        test_target_files: Optional[List[str]] = None,
        feature_df: Optional[pd.DataFrame] = None,
        batch_size: int = 16, 
        num_workers: int = 4, 
        sr: int = 22050,
        segment_length: int = 22050 * 5,
        augment_train: bool = True
    ) -> Tuple[DataLoader, DataLoader]:
        """
        Create PyTorch DataLoaders for training and evaluation.
        
        Args:
            train_files (List[str]): Training audio file paths
            test_files (List[str]): Test audio file paths
            train_target_files (Optional[List[str]]): Training target file paths
            test_target_files (Optional[List[str]]): Test target file paths
            feature_df (Optional[pd.DataFrame]): DataFrame with precomputed features
            batch_size (int): Batch size
            num_workers (int): Number of worker processes
            sr (int): Sample rate
            segment_length (int): Length of audio segments in samples
            augment_train (bool): Whether to apply data augmentation to training set
            
        Returns:
            Tuple[DataLoader, DataLoader]: Training and test DataLoaders
        """
        # Create feature lists if feature_df is provided
        train_features = None
        test_features = None
        
        if feature_df is not None:
            # Create a mapping from file path to features
            feature_map = {row['file_path']: row for _, row in feature_df.iterrows()}
            
            # Create feature lists in the same order as file lists
            train_features = pd.DataFrame([feature_map[file] for file in train_files if file in feature_map])
            test_features = pd.DataFrame([feature_map[file] for file in test_files if file in feature_map])
        
        # Create datasets
        train_dataset = AudioDataset(
            train_files, 
            target_files=train_target_files,
            feature_list=train_features,
            sr=sr, 
            segment_length=segment_length,
            augment=augment_train
        )
        
        test_dataset = AudioDataset(
            test_files, 
            target_files=test_target_files,
            feature_list=test_features,
            sr=sr, 
            segment_length=segment_length,
            augment=False
        )
        
        # Create dataloaders
        train_loader = DataLoader(
            train_dataset, 
            batch_size=batch_size,
            shuffle=True, 
            num_workers=num_workers,
            pin_memory=True
        )
        
        test_loader = DataLoader(
            test_dataset, 
            batch_size=batch_size,
            shuffle=False, 
            num_workers=num_workers,
            pin_memory=True
        )
        
        return train_loader, test_loader