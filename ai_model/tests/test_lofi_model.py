import pytest
import torch
import numpy as np
import tempfile
import os

from ai_model.models.lofi_model import (
    ConvBlock,
    LofiEncoder,
    LofiDecoder,
    ParameterPredictor,
    LofiNet,
    LofiLoss,
    calculate_model_size
)

# Check if CUDA is available
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def test_conv_block():
    """Test ConvBlock module."""
    # Create a sample input tensor
    batch_size = 2
    channels = 3
    length = 100
    x = torch.randn(batch_size, channels, length)
    
    # Test with different configurations
    configs = [
        {"in_channels": 3, "out_channels": 3, "kernel_size": 3, "stride": 1, "use_batch_norm": True},
        {"in_channels": 3, "out_channels": 6, "kernel_size": 3, "stride": 1, "use_batch_norm": True},
        {"in_channels": 3, "out_channels": 3, "kernel_size": 3, "stride": 2, "use_batch_norm": True},
        {"in_channels": 3, "out_channels": 3, "kernel_size": 3, "stride": 1, "use_batch_norm": False}
    ]
    
    for config in configs:
        # Create block
        block = ConvBlock(**config)
        
        # Forward pass
        output = block(x)
        
        # Check output shape
        expected_length = length if config["stride"] == 1 else length // config["stride"]
        assert output.shape == (batch_size, config["out_channels"], expected_length)
        
        # Check residual connection
        if config["in_channels"] == config["out_channels"] and config["stride"] == 1:
            # If residual connection is used, output should not be zero when input is zero
            zero_input = torch.zeros_like(x)
            zero_output = block(zero_input)
            assert not torch.allclose(zero_output, torch.zeros_like(zero_output))

def test_lofi_encoder():
    """Test LofiEncoder module."""
    # Create a sample input tensor
    batch_size = 2
    input_channels = 1
    length = 1024
    x = torch.randn(batch_size, input_channels, length)
    
    # Test without feature conditioning
    encoder = LofiEncoder(
        input_channels=input_channels, 
        base_channels=32, 
        kernel_size=3, 
        num_layers=4, 
        max_channels=128
    )
    
    # Forward pass
    output = encoder(x)
    
    # Check output shape
    # Each downsampling layer halves the length
    expected_length = length // (2 ** (4 - 1))  # num_layers - 1 downsampling layers
    expected_channels = min(32 * (2 ** (4 - 1)), 128)  # base_channels * (2 ** (num_layers - 1))
    assert output.shape == (batch_size, expected_channels, expected_length)
    
    # Test with feature conditioning
    feature_dim = 10
    features = torch.randn(batch_size, feature_dim)
    
    encoder_with_features = LofiEncoder(
        input_channels=input_channels, 
        base_channels=32, 
        kernel_size=3, 
        num_layers=4, 
        max_channels=128,
        feature_dim=feature_dim
    )
    
    # Forward pass with features
    output_with_features = encoder_with_features(x, features)
    
    # Check output shape (should be the same as without features)
    assert output_with_features.shape == (batch_size, expected_channels, expected_length)
    
    # Output with features should be different from output without features
    # (features modulate the encoding)
    if encoder_with_features.feature_conditioning is not None:
        # Regenerate x for a fair comparison
        x = torch.randn(batch_size, input_channels, length)
        output1 = encoder_with_features(x)
        output2 = encoder_with_features(x, features)
        
        # Outputs should be different due to feature conditioning
        assert not torch.allclose(output1, output2)

def test_lofi_decoder():
    """Test LofiDecoder module."""
    # Create a sample input tensor
    batch_size = 2
    encoder_channels = 128
    encoded_length = 64
    x = torch.randn(batch_size, encoder_channels, encoded_length)
    
    # Test decoder
    decoder = LofiDecoder(
        encoder_channels=encoder_channels, 
        output_channels=1, 
        kernel_size=3, 
        num_layers=4, 
        base_channels=32, 
        max_channels=128
    )
    
    # Forward pass
    output = decoder(x)
    
    # Check output shape
    # Each upsampling layer doubles the length
    expected_length = encoded_length * (2 ** (4 - 1))  # num_layers - 1 upsampling layers
    assert output.shape == (batch_size, 1, expected_length)
    
    # Check output range (should be in [-1, 1] due to tanh activation)
    assert torch.min(output) >= -1.0
    assert torch.max(output) <= 1.0

def test_parameter_predictor():
    """Test ParameterPredictor module."""
    # Create a sample input tensor
    batch_size = 2
    input_dim = 20
    x = torch.randn(batch_size, input_dim)
    
    # Test predictor
    predictor = ParameterPredictor(input_dim=input_dim, hidden_dim=64)
    
    # Forward pass
    outputs = predictor(x)
    
    # Check output shapes and ranges
    assert outputs["chill_level"].shape == (batch_size,)
    assert outputs["beat_intensity"].shape == (batch_size,)
    assert outputs["vintage_effect"].shape == (batch_size,)
    
    # Parameters should be in [0, 100] range
    assert torch.all(outputs["chill_level"] >= 0.0)
    assert torch.all(outputs["chill_level"] <= 100.0)
    assert torch.all(outputs["beat_intensity"] >= 0.0)
    assert torch.all(outputs["beat_intensity"] <= 100.0)
    assert torch.all(outputs["vintage_effect"] >= 0.0)
    assert torch.all(outputs["vintage_effect"] <= 100.0)

def test_lofi_net():
    """Test LofiNet model."""
    # Create a sample input tensor
    batch_size = 2
    input_channels = 1
    length = 1024
    x = torch.randn(batch_size, input_channels, length)
    
    # Test without feature conditioning
    model = LofiNet(
        input_channels=input_channels, 
        output_channels=1, 
        base_channels=32, 
        kernel_size=3, 
        num_encoder_layers=4, 
        num_decoder_layers=4, 
        max_channels=128
    )
    
    # Forward pass
    outputs = model(x)
    
    # Check output shapes
    assert outputs["output"].shape == (batch_size, 1, length)
    
    # Test with feature conditioning
    feature_dim = 10
    features = torch.randn(batch_size, feature_dim)
    
    model_with_features = LofiNet(
        input_channels=input_channels, 
        output_channels=1, 
        base_channels=32, 
        kernel_size=3, 
        num_encoder_layers=4, 
        num_decoder_layers=4, 
        max_channels=128,
        feature_dim=feature_dim
    )
    
    # Forward pass with features
    outputs_with_features = model_with_features(x, features)
    
    # Check output shapes
    assert outputs_with_features["output"].shape == (batch_size, 1, length)
    
    # Check parameter predictions
    assert "chill_level" in outputs_with_features
    assert "beat_intensity" in outputs_with_features
    assert "vintage_effect" in outputs_with_features
    assert "mood_logits" in outputs_with_features
    
    # Parameters should be in [0, 100] range
    assert torch.all(outputs_with_features["chill_level"] >= 0.0)
    assert torch.all(outputs_with_features["chill_level"] <= 100.0)
    assert torch.all(outputs_with_features["beat_intensity"] >= 0.0)
    assert torch.all(outputs_with_features["beat_intensity"] <= 100.0)
    assert torch.all(outputs_with_features["vintage_effect"] >= 0.0)
    assert torch.all(outputs_with_features["vintage_effect"] <= 100.0)

def test_lofi_loss():
    """Test LofiLoss module."""
    # Create sample outputs and targets
    batch_size = 2
    length = 1024
    
    outputs = {
        "output": torch.randn(batch_size, 1, length),
        "chill_level": torch.rand(batch_size) * 100,
        "beat_intensity": torch.rand(batch_size) * 100,
        "vintage_effect": torch.rand(batch_size) * 100,
        "mood_logits": torch.randn(batch_size, 3)  # 3 mood classes
    }
    
    targets = {
        "target": torch.randn(batch_size, 1, length),
        "chill_level": torch.rand(batch_size) * 100,
        "beat_intensity": torch.rand(batch_size) * 100,
        "vintage_effect": torch.rand(batch_size) * 100,
        "mood_target": torch.randint(0, 3, (batch_size,))  # Random mood targets
    }
    
    # Test with different configurations
    configs = [
        {"spectral_weight": 0.5, "time_weight": 0.3, "param_weight": 0.2, "use_stft": True},
        {"spectral_weight": 0.0, "time_weight": 1.0, "param_weight": 0.0, "use_stft": False},
        {"spectral_weight": 0.3, "time_weight": 0.3, "param_weight": 0.4, "use_stft": True}
    ]
    
    for config in configs:
        # Create loss function
        loss_fn = LofiLoss(**config)
        
        # Calculate losses
        losses = loss_fn(outputs, targets)
        
        # Check that all expected losses are present
        assert "combined_loss" in losses
        assert "time_loss" in losses
        
        if config["use_stft"]:
            assert "spectral_loss" in losses
        
        if config["param_weight"] > 0:
            assert "param_loss" in losses
            assert "chill_level_loss" in losses
            assert "beat_intensity_loss" in losses
            assert "vintage_effect_loss" in losses
            assert "mood_loss" in losses
        
        # Check that losses are non-negative
        for loss_name, loss_value in losses.items():
            assert loss_value >= 0.0

def test_model_saving_loading():
    """Test model saving and loading."""
    # Create a model
    model = LofiNet(
        input_channels=1, 
        output_channels=1, 
        base_channels=32, 
        kernel_size=3, 
        num_encoder_layers=4, 
        num_decoder_layers=4, 
        max_channels=128,
        feature_dim=10
    )
    
    # Create a sample input
    batch_size = 2
    length = 1024
    x = torch.randn(batch_size, 1, length)
    features = torch.randn(batch_size, 10)
    
    # Get output before saving
    model.eval()
    with torch.no_grad():
        outputs_before = model(x, features)
    
    # Create a temporary file for the checkpoint
    with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as f:
        checkpoint_path = f.name
    
    try:
        # Save model
        torch.save({
            'model_state_dict': model.state_dict(),
            'epoch': 1,
            'val_loss': 0.1
        }, checkpoint_path)
        
        # Create a new model with the same architecture
        model_loaded = LofiNet(
            input_channels=1, 
            output_channels=1, 
            base_channels=32, 
            kernel_size=3, 
            num_encoder_layers=4, 
            num_decoder_layers=4, 
            max_channels=128,
            feature_dim=10
        )
        
        # Load checkpoint
        checkpoint = torch.load(checkpoint_path)
        model_loaded.load_state_dict(checkpoint['model_state_dict'])
        
        # Get output after loading
        model_loaded.eval()
        with torch.no_grad():
            outputs_after = model_loaded(x, features)
        
        # Check that outputs are the same
        assert torch.allclose(outputs_before["output"], outputs_after["output"])
        assert torch.allclose(outputs_before["chill_level"], outputs_after["chill_level"])
        assert torch.allclose(outputs_before["beat_intensity"], outputs_after["beat_intensity"])
        assert torch.allclose(outputs_before["vintage_effect"], outputs_after["vintage_effect"])
        assert torch.allclose(outputs_before["mood_logits"], outputs_after["mood_logits"])
        
    finally:
        # Clean up
        if os.path.exists(checkpoint_path):
            os.remove(checkpoint_path)

def test_calculate_model_size():
    """Test model size calculation."""
    # Create models with different sizes
    models = [
        LofiNet(base_channels=16, num_encoder_layers=3, num_decoder_layers=3),
        LofiNet(base_channels=32, num_encoder_layers=4, num_decoder_layers=4),
        LofiNet(base_channels=64, num_encoder_layers=5, num_decoder_layers=5)
    ]
    
    # Calculate sizes
    sizes = [calculate_model_size(model) for model in models]
    
    # Larger models should have more parameters
    assert sizes[0] < sizes[1] < sizes[2]