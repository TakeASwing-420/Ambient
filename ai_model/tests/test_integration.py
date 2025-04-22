import pytest
import os
import numpy as np
import torch
import tempfile
import soundfile as sf
import json
from typing import Tuple, Dict

from ai_model.utils.audio_utils import AudioProcessor
from ai_model.utils.dataset_utils import DatasetManager, AudioDataset
from ai_model.models.lofi_model import LofiNet, LofiLoss
from ai_model.inference import LofiGenerator

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

# Create a temporary checkpoint file for testing
@pytest.fixture
def temp_model_checkpoint():
    """
    Fixture to create a temporary model checkpoint for testing.
    
    Returns:
        str: Path to temporary checkpoint file
    """
    # Create a model
    model = LofiNet(
        input_channels=1, 
        output_channels=1, 
        base_channels=16,  # Small model for testing
        kernel_size=3, 
        num_encoder_layers=3, 
        num_decoder_layers=3, 
        max_channels=64,
        feature_dim=10
    )
    
    # Create temp file
    with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as f:
        checkpoint_path = f.name
    
    # Save model
    torch.save({
        'model_state_dict': model.state_dict(),
        'epoch': 1,
        'val_loss': 0.1
    }, checkpoint_path)
    
    yield checkpoint_path, model
    
    # Clean up
    if os.path.exists(checkpoint_path):
        os.remove(checkpoint_path)

# Create a temporary model config file for testing
@pytest.fixture
def temp_model_config(temp_model_checkpoint):
    """
    Fixture to create a temporary model config for testing.
    
    Returns:
        str: Path to temporary config file
    """
    _, model = temp_model_checkpoint
    
    # Create config
    config = {
        "model_architecture": {
            "input_channels": 1,
            "output_channels": 1,
            "base_channels": 16,
            "kernel_size": 3,
            "num_encoder_layers": 3,
            "num_decoder_layers": 3,
            "max_channels": 64,
            "feature_dim": 10
        },
        "training_params": {
            "batch_size": 16,
            "learning_rate": 0.0001,
            "epochs": 10,
            "seed": 42
        },
        "num_parameters": sum(p.numel() for p in model.parameters() if p.requires_grad)
    }
    
    # Create temp file
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
        config_path = f.name
    
    # Save config
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)
    
    yield config_path
    
    # Clean up
    if os.path.exists(config_path):
        os.remove(config_path)

def test_dataset_creation(temp_audio_file):
    """Test creating dataset from audio file."""
    # Create dataset
    dataset = AudioDataset([temp_audio_file], segment_length=22050)
    
    # Check dataset length
    assert len(dataset) == 1
    
    # Get item
    item = dataset[0]
    
    # Check item contents
    assert "audio" in item
    assert item["audio"].shape == (22050,)

def test_audio_processing_pipeline(temp_audio_file):
    """Test the entire audio processing pipeline."""
    processor = AudioProcessor()
    
    # Load audio
    y, sr = processor.load_audio(temp_audio_file)
    
    # Extract features
    features = processor.extract_features(y, sr)
    
    # Analyze mood
    parameters = processor.analyze_audio_mood(features)
    
    # Apply effects
    y_lofi = processor.apply_lofi_effects(
        y, sr,
        chill_level=parameters["chill_level"],
        beat_intensity=parameters["beat_intensity"],
        vintage_effect=parameters["vintage_effect"],
        mood=parameters["mood"]
    )
    
    # Check that output has same length as input
    assert len(y_lofi) == len(y)
    
    # Save output
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        output_path = f.name
    
    try:
        processor.save_audio(y_lofi, sr, output_path)
        
        # Check that file exists and has non-zero size
        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
        
        # Load output
        y_loaded, sr_loaded = processor.load_audio(output_path)
        
        # Check that loaded audio matches saved audio
        assert sr_loaded == sr
        assert len(y_loaded) == len(y_lofi)
    finally:
        # Clean up
        if os.path.exists(output_path):
            os.remove(output_path)

def test_inference_pipeline(temp_audio_file, temp_model_checkpoint, temp_model_config):
    """Test the inference pipeline."""
    checkpoint_path, _ = temp_model_checkpoint
    config_path = temp_model_config
    
    # Create generator
    generator = LofiGenerator(
        model_path=checkpoint_path,
        config_path=config_path,
        device="cpu",
        sr=22050,
        segment_length=22050
    )
    
    # Create temp output file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        output_path = f.name
    
    try:
        # Generate lofi
        generator.generate(temp_audio_file, output_path)
        
        # Check that file exists and has non-zero size
        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
        
        # Generate with custom parameters
        custom_params = {
            'chill_level': 80.0,
            'beat_intensity': 20.0,
            'vintage_effect': 70.0,
            'mood': 'sleep'
        }
        
        generator.generate(temp_audio_file, output_path, custom_params)
        
        # Check that file exists and has non-zero size
        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
        
        # Analyze audio
        analysis = generator.analyze_audio(temp_audio_file)
        
        # Check analysis output
        assert "parameters" in analysis
        assert "features" in analysis
        assert "chill_level" in analysis["parameters"]
        assert "beat_intensity" in analysis["parameters"]
        assert "vintage_effect" in analysis["parameters"]
        assert "mood" in analysis["parameters"]
    finally:
        # Clean up
        if os.path.exists(output_path):
            os.remove(output_path)

def test_model_training_step(temp_audio_file):
    """Test a single training step."""
    # Create model
    model = LofiNet(
        input_channels=1, 
        output_channels=1, 
        base_channels=16,  # Small model for testing
        kernel_size=3, 
        num_encoder_layers=3, 
        num_decoder_layers=3, 
        max_channels=64
    )
    
    # Create loss function
    criterion = LofiLoss()
    
    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Create dataset
    dataset = AudioDataset([temp_audio_file], segment_length=22050)
    
    # Create dataloader
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=1)
    
    # Create sample target
    processor = AudioProcessor()
    y, sr = processor.load_audio(temp_audio_file)
    y_target = processor.apply_lofi_effects(y, sr)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        target_path = f.name
    processor.save_audio(y_target, sr, target_path)
    
    try:
        # Create dataset with targets
        dataset_with_target = AudioDataset([temp_audio_file], target_files=[target_path], segment_length=22050)
        
        # Create dataloader
        dataloader_with_target = torch.utils.data.DataLoader(dataset_with_target, batch_size=1)
        
        # Training step
        model.train()
        
        for batch in dataloader_with_target:
            # Get inputs and targets
            audio = batch["audio"].unsqueeze(1)  # Add channel dimension
            target = batch["target"].unsqueeze(1)  # Add channel dimension
            
            # Zero gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(audio)
            
            # Calculate loss
            losses = criterion(outputs, {"target": target})
            loss = losses["combined_loss"]
            
            # Backward pass
            loss.backward()
            
            # Update weights
            optimizer.step()
            
            # Check that loss is valid
            assert loss.item() >= 0.0
            assert not torch.isnan(loss).item()
    finally:
        # Clean up
        if os.path.exists(target_path):
            os.remove(target_path)

def test_end_to_end_pipeline(temp_audio_file, temp_model_checkpoint, temp_model_config):
    """Test end-to-end pipeline with model training and inference."""
    checkpoint_path, _ = temp_model_checkpoint
    config_path = temp_model_config
    
    # Step 1: Process audio using traditional effects for comparison
    processor = AudioProcessor()
    y, sr = processor.load_audio(temp_audio_file)
    features = processor.extract_features(y, sr)
    parameters = processor.analyze_audio_mood(features)
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        traditional_output_path = f.name
    
    try:
        # Apply traditional effects
        y_traditional = processor.apply_lofi_effects(
            y, sr,
            chill_level=parameters["chill_level"],
            beat_intensity=parameters["beat_intensity"],
            vintage_effect=parameters["vintage_effect"],
            mood=parameters["mood"]
        )
        
        processor.save_audio(y_traditional, sr, traditional_output_path)
        
        # Step 2: Use model-based inference
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            model_output_path = f.name
        
        generator = LofiGenerator(
            model_path=checkpoint_path,
            config_path=config_path,
            device="cpu",
            sr=sr,
            segment_length=22050
        )
        
        # Generate lofi using model
        generator.generate(temp_audio_file, model_output_path)
        
        # Check that both outputs exist
        assert os.path.exists(traditional_output_path)
        assert os.path.exists(model_output_path)
        
        # Load both outputs
        y_trad, sr_trad = processor.load_audio(traditional_output_path)
        y_model, sr_model = processor.load_audio(model_output_path)
        
        # Compare sample rates
        assert sr_trad == sr_model
        
        # Both should produce valid audio (no NaNs or Infs)
        assert not np.any(np.isnan(y_trad))
        assert not np.any(np.isinf(y_trad))
        assert not np.any(np.isnan(y_model))
        assert not np.any(np.isinf(y_model))
        
        # Both should be normalized
        assert np.max(np.abs(y_trad)) <= 1.0
        assert np.max(np.abs(y_model)) <= 1.0
        
    finally:
        # Clean up
        for path in [traditional_output_path, model_output_path]:
            if os.path.exists(path):
                os.remove(path)