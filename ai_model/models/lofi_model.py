import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple, Dict, Any, List
import numpy as np

class ConvBlock(nn.Module):
    """
    Convolutional block with batch normalization and residual connection.
    """
    def __init__(
        self, 
        in_channels: int, 
        out_channels: int, 
        kernel_size: int = 3, 
        stride: int = 1,
        padding: int = 1,
        dilation: int = 1,
        use_batch_norm: bool = True,
        dropout_prob: float = 0.1
    ):
        super(ConvBlock, self).__init__()
        
        self.conv = nn.Conv1d(
            in_channels, 
            out_channels, 
            kernel_size=kernel_size, 
            stride=stride,
            padding=padding,
            dilation=dilation
        )
        self.use_batch_norm = use_batch_norm
        if use_batch_norm:
            self.bn = nn.BatchNorm1d(out_channels)
        self.dropout = nn.Dropout(dropout_prob)
        self.activation = nn.GELU()
        
        # Residual connection if dimensions match
        self.residual = in_channels == out_channels and stride == 1
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = x
        
        out = self.conv(x)
        if self.use_batch_norm:
            out = self.bn(out)
        out = self.activation(out)
        out = self.dropout(out)
        
        if self.residual:
            out = out + identity
            
        return out

class LofiEncoder(nn.Module):
    """
    Encoder network for the LofiNet model.
    """
    def __init__(
        self, 
        input_channels: int = 1, 
        base_channels: int = 32, 
        kernel_size: int = 3,
        num_layers: int = 6,
        max_channels: int = 256,
        feature_dim: Optional[int] = None
    ):
        super(LofiEncoder, self).__init__()
        
        self.layers = nn.ModuleList()
        in_channels = input_channels
        
        # Create encoder layers
        for i in range(num_layers):
            out_channels = min(base_channels * (2 ** i), max_channels)
            stride = 2 if i < num_layers - 1 else 1  # No downsampling in the last layer
            
            self.layers.append(
                ConvBlock(
                    in_channels, 
                    out_channels, 
                    kernel_size=kernel_size, 
                    stride=stride,
                    padding=kernel_size // 2,
                    use_batch_norm=True,
                    dropout_prob=0.1
                )
            )
            
            in_channels = out_channels
        
        # Feature conditioning (if provided)
        self.feature_conditioning = None
        if feature_dim is not None:
            out_channels = min(base_channels * (2 ** (num_layers - 1)), max_channels)
            self.feature_conditioning = nn.Sequential(
                nn.Linear(feature_dim, 128),
                nn.GELU(),
                nn.Linear(128, out_channels),
                nn.Sigmoid()
            )
    
    def forward(self, x: torch.Tensor, features: Optional[torch.Tensor] = None) -> torch.Tensor:
        # Input shape: [batch_size, 1, seq_len]
        
        # Encoder path
        for layer in self.layers:
            x = layer(x)
        
        # Apply feature conditioning if provided
        if features is not None and self.feature_conditioning is not None:
            # Process features
            feature_weights = self.feature_conditioning(features)
            # Apply as channel-wise scaling
            x = x * feature_weights.unsqueeze(-1)
            
        return x

class LofiDecoder(nn.Module):
    """
    Decoder network for the LofiNet model.
    """
    def __init__(
        self, 
        encoder_channels: int, 
        output_channels: int = 1, 
        kernel_size: int = 3,
        num_layers: int = 6,
        base_channels: int = 32,
        max_channels: int = 256
    ):
        super(LofiDecoder, self).__init__()
        
        self.layers = nn.ModuleList()
        in_channels = encoder_channels
        
        # Create decoder layers
        for i in range(num_layers):
            # Calculate out_channels (decreasing)
            layer_idx = num_layers - i - 1
            out_channels = min(base_channels * (2 ** layer_idx), max_channels)
            if i == num_layers - 1:  # Last layer outputs the target channels
                out_channels = output_channels
            
            is_last_layer = i == num_layers - 1
            
            # Only use upsampling in non-last layers
            if not is_last_layer:
                self.layers.append(nn.Upsample(scale_factor=2, mode='nearest'))
            
            # Add convolution
            self.layers.append(
                ConvBlock(
                    in_channels, 
                    out_channels, 
                    kernel_size=kernel_size, 
                    stride=1,
                    padding=kernel_size // 2,
                    use_batch_norm=not is_last_layer,  # No BN in the last layer
                    dropout_prob=0.1 if not is_last_layer else 0.0  # No dropout in the last layer
                )
            )
            
            in_channels = out_channels
            
        # Final activation to ensure output is in [-1, 1]
        self.final_activation = nn.Tanh()
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Process through all layers
        for layer in self.layers:
            x = layer(x)
        
        # Apply final activation
        x = self.final_activation(x)
        
        return x

class ParameterPredictor(nn.Module):
    """
    Network to predict lofi effect parameters from audio features.
    """
    def __init__(self, input_dim: int, hidden_dim: int = 128):
        super(ParameterPredictor, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, 4)  # 3 continuous params + 1 for mood logits
        )
    
    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        outputs = self.network(x)
        
        # Split outputs into different parameters
        chill_level = torch.sigmoid(outputs[:, 0]) * 100  # 0-100 scale
        beat_intensity = torch.sigmoid(outputs[:, 1]) * 100  # 0-100 scale
        vintage_effect = torch.sigmoid(outputs[:, 2]) * 100  # 0-100 scale
        mood_logits = outputs[:, 3:]  # Logits for mood classification
        
        return {
            'chill_level': chill_level,
            'beat_intensity': beat_intensity,
            'vintage_effect': vintage_effect,
            'mood_logits': mood_logits
        }

class LofiNet(nn.Module):
    """
    Complete LofiNet model for converting audio to lofi style.
    """
    def __init__(
        self, 
        input_channels: int = 1, 
        output_channels: int = 1, 
        base_channels: int = 32,
        kernel_size: int = 3,
        num_encoder_layers: int = 6,
        num_decoder_layers: int = 6,
        max_channels: int = 256,
        feature_dim: Optional[int] = None
    ):
        super(LofiNet, self).__init__()
        
        # Encoder
        self.encoder = LofiEncoder(
            input_channels=input_channels,
            base_channels=base_channels,
            kernel_size=kernel_size,
            num_layers=num_encoder_layers,
            max_channels=max_channels,
            feature_dim=feature_dim
        )
        
        # Calculate encoder output channels
        encoder_out_channels = min(base_channels * (2 ** (num_encoder_layers - 1)), max_channels)
        
        # Decoder
        self.decoder = LofiDecoder(
            encoder_channels=encoder_out_channels,
            output_channels=output_channels,
            kernel_size=kernel_size,
            num_layers=num_decoder_layers,
            base_channels=base_channels,
            max_channels=max_channels
        )
        
        # Parameter predictor (from features, if applicable)
        self.param_predictor = None
        if feature_dim is not None:
            self.param_predictor = ParameterPredictor(feature_dim)
    
    def forward(
        self, 
        x: torch.Tensor, 
        features: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        # Input shape: [batch_size, 1, seq_len]
        
        # Encode
        encoded = self.encoder(x, features)
        
        # Decode
        output = self.decoder(encoded)
        
        result = {'output': output}
        
        # Add parameter predictions if applicable
        if features is not None and self.param_predictor is not None:
            params = self.param_predictor(features)
            result.update(params)
            
        return result

class LofiLoss(nn.Module):
    """
    Custom loss function for LofiNet training.
    """
    def __init__(
        self, 
        spectral_weight: float = 0.5,
        time_weight: float = 0.3,
        param_weight: float = 0.2,
        use_stft: bool = True
    ):
        super(LofiLoss, self).__init__()
        
        self.spectral_weight = spectral_weight
        self.time_weight = time_weight
        self.param_weight = param_weight
        self.use_stft = use_stft
        
        # L1 loss for time domain
        self.l1_loss = nn.L1Loss()
        
        # MSE loss for parameters
        self.mse_loss = nn.MSELoss()
        
        # Cross entropy for mood classification
        self.ce_loss = nn.CrossEntropyLoss()
    
    def forward(
        self, 
        outputs: Dict[str, torch.Tensor],
        targets: Dict[str, torch.Tensor]
    ) -> Dict[str, torch.Tensor]:
        losses = {}
        
        # Time domain loss
        if 'output' in outputs and 'target' in targets:
            time_loss = self.l1_loss(outputs['output'], targets['target'])
            losses['time_loss'] = time_loss
            
            # Spectral loss (STFT-based)
            if self.use_stft:
                # Compute STFTs
                pred_stft = torch.stft(
                    outputs['output'].view(-1, outputs['output'].shape[-1]),
                    n_fft=1024,
                    hop_length=256,
                    return_complex=True
                )
                target_stft = torch.stft(
                    targets['target'].view(-1, targets['target'].shape[-1]),
                    n_fft=1024,
                    hop_length=256,
                    return_complex=True
                )
                
                # Compute magnitudes
                pred_mag = torch.abs(pred_stft)
                target_mag = torch.abs(target_stft)
                
                # Log scaling
                eps = 1e-8
                pred_mag_log = torch.log(pred_mag + eps)
                target_mag_log = torch.log(target_mag + eps)
                
                # L1 loss on log magnitudes
                spec_loss = F.l1_loss(pred_mag_log, target_mag_log)
                losses['spectral_loss'] = spec_loss
        
        # Parameter losses
        param_losses = []
        for param in ['chill_level', 'beat_intensity', 'vintage_effect']:
            if param in outputs and param in targets:
                param_loss = self.mse_loss(outputs[param], targets[param])
                losses[f'{param}_loss'] = param_loss
                param_losses.append(param_loss)
        
        # Mood classification loss
        if 'mood_logits' in outputs and 'mood_target' in targets:
            mood_loss = self.ce_loss(outputs['mood_logits'], targets['mood_target'])
            losses['mood_loss'] = mood_loss
            param_losses.append(mood_loss)
        
        # Combine losses
        combined_loss = 0.0
        
        if 'time_loss' in losses:
            combined_loss += self.time_weight * losses['time_loss']
            
        if 'spectral_loss' in losses:
            combined_loss += self.spectral_weight * losses['spectral_loss']
            
        if param_losses:
            avg_param_loss = torch.mean(torch.stack(param_losses))
            combined_loss += self.param_weight * avg_param_loss
            losses['param_loss'] = avg_param_loss
        
        losses['combined_loss'] = combined_loss
        
        return losses

def calculate_model_size(model: nn.Module) -> int:
    """
    Calculate the number of parameters in a model.
    
    Args:
        model (nn.Module): PyTorch model
        
    Returns:
        int: Number of parameters
    """
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

def test_model_output_shape():
    """
    Test function to verify model output shapes.
    """
    # Create small test inputs
    batch_size = 2
    seq_len = 44100  # 1 second at 44.1kHz
    feature_dim = 20
    
    # Create model
    model = LofiNet(feature_dim=feature_dim)
    
    # Create inputs
    x = torch.randn(batch_size, 1, seq_len)
    features = torch.randn(batch_size, feature_dim)
    
    # Forward pass
    with torch.no_grad():
        outputs = model(x, features)
    
    # Check output shapes
    assert outputs['output'].shape == (batch_size, 1, seq_len), f"Expected shape {(batch_size, 1, seq_len)}, got {outputs['output'].shape}"
    assert outputs['chill_level'].shape == (batch_size,), f"Expected shape {(batch_size,)}, got {outputs['chill_level'].shape}"
    assert outputs['beat_intensity'].shape == (batch_size,), f"Expected shape {(batch_size,)}, got {outputs['beat_intensity'].shape}"
    assert outputs['vintage_effect'].shape == (batch_size,), f"Expected shape {(batch_size,)}, got {outputs['vintage_effect'].shape}"
    
    print("Model output shapes verified!")
    
    # Calculate model size
    num_params = calculate_model_size(model)
    print(f"Model has {num_params:,} trainable parameters")
    
    return model, outputs

if __name__ == "__main__":
    # Quick test
    test_model_output_shape()