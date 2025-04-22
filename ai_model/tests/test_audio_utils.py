import pytest
import numpy as np
import os
import librosa
import soundfile as sf
import tempfile
from typing import Tuple

from ai_model.utils.audio_utils import AudioProcessor

# Create a simple sine wave for testing
def create_test_audio(duration: float = 2.0, sr: int = 22050) -> Tuple[np.ndarray, int]:
    """
    Create a test audio signal (sine wave).
    
    Args:
        duration (float): Duration in seconds
        sr (int): Sample rate
        
    Returns:
        Tuple[np.ndarray, int]: Audio data and sample rate
    """
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Create a 440 Hz sine wave
    y = 0.5 * np.sin(2 * np.pi * 440 * t)
    return y, sr

# Create a temporary audio file for testing
@pytest.fixture
def temp_audio_file():
    """
    Fixture to create a temporary audio file for testing.
    
    Returns:
        str: Path to temporary audio file
    """
    # Create temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        temp_path = f.name
    
    # Create test audio
    y, sr = create_test_audio()
    
    # Save to temp file
    sf.write(temp_path, y, sr)
    
    yield temp_path
    
    # Clean up
    if os.path.exists(temp_path):
        os.remove(temp_path)

def test_audio_processor_init():
    """Test AudioProcessor initialization."""
    processor = AudioProcessor(sr=22050)
    assert processor.sr == 22050

def test_load_audio(temp_audio_file):
    """Test loading audio file."""
    processor = AudioProcessor()
    y, sr = processor.load_audio(temp_audio_file)
    
    assert isinstance(y, np.ndarray)
    assert sr == processor.sr
    assert len(y) > 0

def test_save_audio(temp_audio_file):
    """Test saving audio file."""
    processor = AudioProcessor()
    y, sr = processor.load_audio(temp_audio_file)
    
    # Create temp output file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        output_path = f.name
    
    try:
        # Save audio
        processor.save_audio(y, sr, output_path)
        
        # Check that file exists and has non-zero size
        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
        
        # Load saved audio and check properties
        y_saved, sr_saved = librosa.load(output_path, sr=sr)
        assert sr_saved == sr
        assert len(y_saved) == len(y)
        # Allow small differences due to encoding/decoding
        assert np.allclose(y_saved, y, atol=1e-4)
    finally:
        # Clean up
        if os.path.exists(output_path):
            os.remove(output_path)

def test_extract_features(temp_audio_file):
    """Test feature extraction."""
    processor = AudioProcessor()
    y, sr = processor.load_audio(temp_audio_file)
    
    features = processor.extract_features(y, sr)
    
    # Check that all expected features are present
    assert "spectral_centroid_mean" in features
    assert "spectral_centroid_std" in features
    assert "rolloff_mean" in features
    assert "zero_crossing_rate" in features
    assert "tempo" in features
    assert "rms_mean" in features
    assert "rms_std" in features
    assert "contrast_mean" in features
    assert "bandwidth_mean" in features
    assert "mfcc_1_mean" in features
    assert "chroma_mean" in features
    
    # Check feature types
    for k, v in features.items():
        assert isinstance(v, (float, int, np.float32, np.float64))

def test_apply_lofi_effects():
    """Test applying lofi effects."""
    processor = AudioProcessor()
    y, sr = create_test_audio()
    
    # Test with different parameter combinations
    parameter_sets = [
        {"chill_level": 50.0, "beat_intensity": 50.0, "vintage_effect": 50.0, "mood": "relaxed"},
        {"chill_level": 80.0, "beat_intensity": 20.0, "vintage_effect": 70.0, "mood": "sleep"},
        {"chill_level": 30.0, "beat_intensity": 70.0, "vintage_effect": 30.0, "mood": "focus"}
    ]
    
    for params in parameter_sets:
        y_processed = processor.apply_lofi_effects(
            y, sr, 
            chill_level=params["chill_level"],
            beat_intensity=params["beat_intensity"],
            vintage_effect=params["vintage_effect"],
            mood=params["mood"]
        )
        
        # Check that output has same length as input
        assert len(y_processed) == len(y)
        
        # Check that output is not identical to input (effects were applied)
        assert not np.array_equal(y_processed, y)
        
        # Check that output is normalized (max abs value <= 1.0)
        assert np.max(np.abs(y_processed)) <= 1.0

def test_get_audio_segments():
    """Test segmenting audio."""
    processor = AudioProcessor()
    y, sr = create_test_audio(duration=10.0)  # 10 seconds of audio
    
    # Test with 2-second segments
    segment_duration = 2.0
    segments = processor.get_audio_segments(y, sr, segment_duration)
    
    # Check number of segments
    expected_segments = int(np.ceil(10.0 / segment_duration))
    assert len(segments) == expected_segments
    
    # Check segment lengths
    segment_length = int(segment_duration * sr)
    for segment in segments:
        assert len(segment) == segment_length

def test_analyze_audio_mood():
    """Test audio mood analysis."""
    processor = AudioProcessor()
    y, sr = create_test_audio()
    
    features = processor.extract_features(y, sr)
    parameters = processor.analyze_audio_mood(features)
    
    # Check that all expected parameters are present
    assert "chill_level" in parameters
    assert "beat_intensity" in parameters
    assert "vintage_effect" in parameters
    assert "mood" in parameters
    
    # Check parameter types and ranges
    assert 0.0 <= parameters["chill_level"] <= 100.0
    assert 0.0 <= parameters["beat_intensity"] <= 100.0
    assert 0.0 <= parameters["vintage_effect"] <= 100.0
    assert parameters["mood"] in ["relaxed", "focus", "sleep"]

def test_enhance_beats():
    """Test beat enhancement."""
    processor = AudioProcessor()
    y, sr = create_test_audio()
    
    # Test with different intensities
    for intensity in [0.0, 0.5, 1.0]:
        y_enhanced = processor.enhance_beats(y, sr, intensity)
        
        # Check that output has same length as input
        assert len(y_enhanced) == len(y)
        
        # Check that output is normalized
        assert np.max(np.abs(y_enhanced)) <= 1.0
        
        # If intensity is 0, output should be close to input
        if intensity == 0.0:
            assert np.allclose(y_enhanced, y, atol=1e-4)
        else:
            # Otherwise, output should be different
            assert not np.array_equal(y_enhanced, y)

def test_apply_time_stretching():
    """Test time stretching."""
    processor = AudioProcessor()
    y, sr = create_test_audio()
    
    # Test with different rates
    for rate in [0.8, 1.0, 1.2]:
        y_stretched = processor.apply_time_stretching(y, sr, rate)
        
        # Check that output length is approximately correct
        # (inversely proportional to rate)
        expected_length = int(len(y) / rate)
        assert abs(len(y_stretched) - expected_length) < sr * 0.1  # Allow small difference
        
        # If rate is 1.0, output should be close to input
        if rate == 1.0:
            # Trim to same length for comparison
            min_len = min(len(y), len(y_stretched))
            assert np.allclose(y_stretched[:min_len], y[:min_len], atol=1e-4)

def test_apply_pitch_shifting():
    """Test pitch shifting."""
    processor = AudioProcessor()
    y, sr = create_test_audio()
    
    # Test with different steps
    for steps in [-2.0, 0.0, 2.0]:
        y_shifted = processor.apply_pitch_shifting(y, sr, steps)
        
        # Check that output has same length as input
        # (pitch shifting should preserve length)
        assert len(y_shifted) == len(y)
        
        # If steps is 0.0, output should be close to input
        if steps == 0.0:
            assert np.allclose(y_shifted, y, atol=1e-4)
        else:
            # Otherwise, output should be different
            assert not np.array_equal(y_shifted, y)