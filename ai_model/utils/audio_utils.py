import os
import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Any, Tuple, List, Optional
from pedalboard import Pedalboard, Gain, Reverb, Compressor, LowpassFilter, Chorus, Delay, Phaser
import torchaudio
import torch
from tqdm import tqdm

class AudioProcessor:
    """
    Utility class for processing audio files, extracting features, and applying effects.
    """
    def __init__(self, sr: int = 22050):
        """
        Initialize the AudioProcessor.
        
        Args:
            sr (int): Sample rate for audio processing
        """
        self.sr = sr

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load an audio file and convert to mono if needed.
        
        Args:
            file_path (str): Path to audio file
            
        Returns:
            Tuple[np.ndarray, int]: Audio data and sample rate
        """
        y, sr = librosa.load(file_path, sr=self.sr, mono=True)
        return y, sr
    
    def save_audio(self, y: np.ndarray, sr: int, file_path: str) -> None:
        """
        Save audio data to a file.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            file_path (str): Output file path
        """
        sf.write(file_path, y, sr)
        
    def extract_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """
        Extract audio features from the given audio data.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            
        Returns:
            Dict[str, Any]: Dictionary containing extracted features
        """
        # Compute common features
        features = {}
        
        # Spectral centroid (brightness)
        cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        features['spectral_centroid_mean'] = np.mean(cent)
        features['spectral_centroid_std'] = np.std(cent)
        
        # Spectral rolloff (high-frequency content)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        features['rolloff_mean'] = np.mean(rolloff)
        
        # Zero crossing rate (noisiness)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        features['zero_crossing_rate'] = np.mean(zcr)
        
        # Tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        features['tempo'] = tempo
        
        # RMS energy
        rms = librosa.feature.rms(y=y)[0]
        features['rms_mean'] = np.mean(rms)
        features['rms_std'] = np.std(rms)
        
        # Spectral contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        features['contrast_mean'] = np.mean(contrast)
        
        # Spectral bandwidth
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        features['bandwidth_mean'] = np.mean(bandwidth)
        
        # MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        for i, mfcc in enumerate(mfccs):
            features[f'mfcc_{i+1}_mean'] = np.mean(mfcc)
            features[f'mfcc_{i+1}_std'] = np.std(mfcc)
        
        # Chromagram
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        features['chroma_mean'] = np.mean(chroma)
        
        return features

    def apply_lofi_effects(
        self, 
        y: np.ndarray, 
        sr: int, 
        chill_level: float = 0.5, 
        beat_intensity: float = 0.5, 
        vintage_effect: float = 0.5, 
        mood: str = 'relaxed'
    ) -> np.ndarray:
        """
        Apply lo-fi effects to the audio based on parameters.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            chill_level (float): Amount of chill effect (0-1)
            beat_intensity (float): Beat strength (0-1)
            vintage_effect (float): Amount of vintage/analog warmth (0-1)
            mood (str): Mood type ('relaxed', 'focus', 'sleep')
            
        Returns:
            np.ndarray: Processed audio data
        """
        # Normalize parameter values to 0-1 range
        chill_level = min(max(chill_level / 100.0, 0.0), 1.0)
        beat_intensity = min(max(beat_intensity / 100.0, 0.0), 1.0)
        vintage_effect = min(max(vintage_effect / 100.0, 0.0), 1.0)
        
        # Base effect settings based on mood
        mood_settings = {
            'relaxed': {
                'reverb_wet': 0.25,
                'reverb_room_size': 0.7,
                'delay_mix': 0.15,
                'chorus_depth': 0.3,
                'lowpass_cutoff': 8000,
                'phaser_depth': 0.4,
            },
            'focus': {
                'reverb_wet': 0.15,
                'reverb_room_size': 0.5,
                'delay_mix': 0.1,
                'chorus_depth': 0.2,
                'lowpass_cutoff': 10000,
                'phaser_depth': 0.3,
            },
            'sleep': {
                'reverb_wet': 0.4,
                'reverb_room_size': 0.9,
                'delay_mix': 0.25,
                'chorus_depth': 0.5,
                'lowpass_cutoff': 5000,
                'phaser_depth': 0.6,
            }
        }
        
        # Get settings for selected mood (default to 'relaxed')
        settings = mood_settings.get(mood, mood_settings['relaxed'])
        
        # Create the effect chain
        board = Pedalboard([
            # Add warmth and compression (variable)
            Compressor(
                threshold_db=-15 - (vintage_effect * 10),
                ratio=2 + (vintage_effect * 2),
                attack_ms=10 + (vintage_effect * 40),
                release_ms=100 + (vintage_effect * 400)
            ),
            
            # Vintage filter effect (variable)
            LowpassFilter(
                cutoff_frequency_hz=settings['lowpass_cutoff'] - (vintage_effect * 3000)
            ),
            
            # Chorus for thickening (variable with chill)
            Chorus(
                rate_hz=0.7 + (chill_level * 0.5), 
                depth=settings['chorus_depth'] * chill_level, 
                mix=0.2 * chill_level
            ),
            
            # Reverb for space (variable with chill)
            Reverb(
                wet_level=settings['reverb_wet'] * chill_level,
                room_size=settings['reverb_room_size']
            ),
            
            # Delay (based on beat intensity)
            Delay(
                delay_seconds=0.125 + (0.125 * (1 - beat_intensity)),
                feedback=0.4 * beat_intensity,
                mix=settings['delay_mix'] * beat_intensity
            ),
            
            # Phaser for movement
            Phaser(
                rate_hz=0.4 + (0.3 * chill_level),
                depth=settings['phaser_depth'] * chill_level,
                feedback=0.2 * chill_level,
                mix=0.2 * chill_level
            ),
            
            # Final gain adjustment
            Gain(gain_db=-3)
        ])
        
        # Apply the effects
        processed_audio = board(y, sr)
        
        return processed_audio

    def get_audio_segments(self, y: np.ndarray, sr: int, segment_duration: float = 5.0) -> List[np.ndarray]:
        """
        Split audio into segments of specified duration.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            segment_duration (float): Duration of each segment in seconds
            
        Returns:
            List[np.ndarray]: List of audio segments
        """
        # Calculate segment length in samples
        segment_length = int(segment_duration * sr)
        
        # Split audio into segments
        segments = []
        for i in range(0, len(y), segment_length):
            segment = y[i:i + segment_length]
            
            # If the segment is too short, pad it
            if len(segment) < segment_length:
                segment = np.pad(segment, (0, segment_length - len(segment)))
                
            segments.append(segment)
            
        return segments

    def analyze_audio_mood(self, features: Dict[str, Any]) -> Dict[str, float]:
        """
        Analyze audio features to determine mood parameters.
        
        Args:
            features (Dict[str, Any]): Extracted audio features
            
        Returns:
            Dict[str, float]: Recommended parameters for lofi conversion
        """
        # Initialize parameters with default values
        parameters = {
            'chill_level': 50.0,
            'beat_intensity': 50.0,
            'vintage_effect': 50.0,
            'mood': 'relaxed'
        }
        
        # Analyze energy level for chill_level
        energy = features['rms_mean'] * 100
        if energy < 0.1:
            parameters['chill_level'] = 80.0
            parameters['mood'] = 'sleep'
        elif energy < 0.2:
            parameters['chill_level'] = 70.0
            parameters['mood'] = 'relaxed'
        elif energy < 0.4:
            parameters['chill_level'] = 50.0
            parameters['mood'] = 'focus'
        else:
            parameters['chill_level'] = 30.0
            parameters['mood'] = 'focus'
        
        # Analyze tempo for beat_intensity
        tempo = features['tempo']
        if tempo < 80:
            parameters['beat_intensity'] = 30.0
        elif tempo < 100:
            parameters['beat_intensity'] = 50.0
        elif tempo < 120:
            parameters['beat_intensity'] = 70.0
        else:
            parameters['beat_intensity'] = 85.0
        
        # Analyze brightness for vintage_effect
        brightness = features['spectral_centroid_mean'] / 5000
        if brightness < 0.5:
            parameters['vintage_effect'] = 70.0
        elif brightness < 0.8:
            parameters['vintage_effect'] = 50.0
        else:
            parameters['vintage_effect'] = 30.0
        
        return parameters

    def enhance_beats(self, y: np.ndarray, sr: int, intensity: float = 0.5) -> np.ndarray:
        """
        Enhance the beats in the audio based on intensity.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            intensity (float): Beat enhancement intensity (0-1)
            
        Returns:
            np.ndarray: Audio with enhanced beats
        """
        # Compute percussive component
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        # Enhance percussive component based on intensity
        y_percussive = y_percussive * (1.0 + intensity)
        
        # Recombine with original, weighted by intensity
        y_enhanced = y_harmonic + y_percussive
        
        # Normalize
        y_enhanced = librosa.util.normalize(y_enhanced)
        
        return y_enhanced

    def apply_time_stretching(self, y: np.ndarray, sr: int, rate: float = 0.9) -> np.ndarray:
        """
        Apply time stretching to audio.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            rate (float): Time stretching rate (< 1 for slower, > 1 for faster)
            
        Returns:
            np.ndarray: Time-stretched audio
        """
        return librosa.effects.time_stretch(y, rate=rate)

    def apply_pitch_shifting(self, y: np.ndarray, sr: int, steps: float = -2.0) -> np.ndarray:
        """
        Apply pitch shifting to audio.
        
        Args:
            y (np.ndarray): Audio data
            sr (int): Sample rate
            steps (float): Pitch shifting in semitones
            
        Returns:
            np.ndarray: Pitch-shifted audio
        """
        return librosa.effects.pitch_shift(y, sr=sr, n_steps=steps)

def visualize_waveform(y: np.ndarray, sr: int, output_path: str) -> None:
    """
    Visualize audio waveform and save to file.
    
    Args:
        y (np.ndarray): Audio data
        sr (int): Sample rate
        output_path (str): Path to save visualization
    """
    import matplotlib.pyplot as plt
    
    plt.figure(figsize=(12, 4))
    plt.plot(np.linspace(0, len(y)/sr, len(y)), y)
    plt.title('Audio Waveform')
    plt.xlabel('Time (s)')
    plt.ylabel('Amplitude')
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()

def visualize_spectrogram(y: np.ndarray, sr: int, output_path: str) -> None:
    """
    Visualize audio spectrogram and save to file.
    
    Args:
        y (np.ndarray): Audio data
        sr (int): Sample rate
        output_path (str): Path to save visualization
    """
    import matplotlib.pyplot as plt
    
    D = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
    plt.figure(figsize=(12, 4))
    librosa.display.specshow(D, sr=sr, x_axis='time', y_axis='log')
    plt.colorbar(format='%+2.0f dB')
    plt.title('Spectrogram')
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()