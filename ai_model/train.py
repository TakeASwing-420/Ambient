import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm
import argparse
import json
import pandas as pd
import time
from typing import Dict, Tuple, List, Optional, Any, Union
import random

from ai_model.models.lofi_model import LofiNet, LofiLoss, calculate_model_size
from ai_model.utils.dataset_utils import DatasetManager, AudioDataset
from ai_model.utils.audio_utils import AudioProcessor

def set_seed(seed: int = 42) -> None:
    """
    Set random seed for reproducibility.
    
    Args:
        seed (int): Random seed
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    os.environ['PYTHONHASHSEED'] = str(seed)

def train_one_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
    epoch: int,
    log_interval: int = 10
) -> Dict[str, float]:
    """
    Train the model for one epoch.
    
    Args:
        model (nn.Module): The model to train
        dataloader (DataLoader): Training data loader
        optimizer (optim.Optimizer): Optimizer
        criterion (nn.Module): Loss function
        device (torch.device): Device to use for training
        epoch (int): Current epoch number
        log_interval (int): How often to log training loss
        
    Returns:
        Dict[str, float]: Dictionary of average losses
    """
    model.train()
    
    running_losses = {}
    total_samples = 0
    
    progress_bar = tqdm(dataloader, desc=f"Epoch {epoch}")
    for i, batch in enumerate(progress_bar):
        # Move data to device
        audio = batch['audio'].to(device)
        
        # Create model inputs and targets
        inputs = {'audio': audio.unsqueeze(1)}  # Add channel dimension
        targets = {}
        
        if 'target' in batch:
            targets['target'] = batch['target'].unsqueeze(1).to(device)
        
        if 'features' in batch:
            inputs['features'] = batch['features'].to(device)
        
        # Forward pass
        outputs = model(**inputs)
        
        # Calculate loss
        losses = criterion(outputs, targets)
        loss = losses['combined_loss']
        
        # Backward pass and optimize
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Update running losses
        batch_size = audio.size(0)
        total_samples += batch_size
        
        for k, v in losses.items():
            if k not in running_losses:
                running_losses[k] = 0.0
            running_losses[k] += v.item() * batch_size
        
        # Update progress bar
        if i % log_interval == 0:
            progress_bar.set_postfix({
                'loss': loss.item(),
                'time_loss': losses.get('time_loss', 0).item() if 'time_loss' in losses else 0,
                'spec_loss': losses.get('spectral_loss', 0).item() if 'spectral_loss' in losses else 0
            })
    
    # Calculate average losses
    avg_losses = {k: v / total_samples for k, v in running_losses.items()}
    
    return avg_losses

def validate(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Dict[str, float]:
    """
    Validate the model.
    
    Args:
        model (nn.Module): The model to validate
        dataloader (DataLoader): Validation data loader
        criterion (nn.Module): Loss function
        device (torch.device): Device to use for validation
        
    Returns:
        Dict[str, float]: Dictionary of average validation losses
    """
    model.eval()
    
    val_losses = {}
    total_samples = 0
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Validation"):
            # Move data to device
            audio = batch['audio'].to(device)
            
            # Create model inputs and targets
            inputs = {'audio': audio.unsqueeze(1)}  # Add channel dimension
            targets = {}
            
            if 'target' in batch:
                targets['target'] = batch['target'].unsqueeze(1).to(device)
            
            if 'features' in batch:
                inputs['features'] = batch['features'].to(device)
            
            # Forward pass
            outputs = model(**inputs)
            
            # Calculate loss
            losses = criterion(outputs, targets)
            
            # Update validation losses
            batch_size = audio.size(0)
            total_samples += batch_size
            
            for k, v in losses.items():
                if k not in val_losses:
                    val_losses[k] = 0.0
                val_losses[k] += v.item() * batch_size
    
    # Calculate average losses
    avg_val_losses = {k: v / total_samples for k, v in val_losses.items()}
    
    return avg_val_losses

def train_model(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
    num_epochs: int,
    checkpoint_dir: str,
    patience: int = 5,
    scheduler: Optional[Any] = None
) -> Tuple[nn.Module, Dict[str, List[float]]]:
    """
    Train the model for multiple epochs with early stopping.
    
    Args:
        model (nn.Module): The model to train
        train_loader (DataLoader): Training data loader
        val_loader (DataLoader): Validation data loader
        optimizer (optim.Optimizer): Optimizer
        criterion (nn.Module): Loss function
        device (torch.device): Device to use for training
        num_epochs (int): Maximum number of epochs to train
        checkpoint_dir (str): Directory to save checkpoints
        patience (int): Early stopping patience
        scheduler (Optional[Any]): Learning rate scheduler
        
    Returns:
        Tuple[nn.Module, Dict[str, List[float]]]: Trained model and training history
    """
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    # Initialize history
    history = {
        'train_loss': [],
        'val_loss': [],
        'train_time_loss': [],
        'val_time_loss': [],
        'train_spectral_loss': [],
        'val_spectral_loss': [],
        'learning_rate': []
    }
    
    # Initialize early stopping variables
    best_val_loss = float('inf')
    patience_counter = 0
    
    # Training loop
    for epoch in range(1, num_epochs + 1):
        epoch_start_time = time.time()
        
        # Train one epoch
        train_losses = train_one_epoch(
            model, train_loader, optimizer, criterion, device, epoch
        )
        
        # Validate
        val_losses = validate(model, val_loader, criterion, device)
        
        # Update history
        history['train_loss'].append(train_losses.get('combined_loss', 0))
        history['val_loss'].append(val_losses.get('combined_loss', 0))
        
        history['train_time_loss'].append(train_losses.get('time_loss', 0))
        history['val_time_loss'].append(val_losses.get('time_loss', 0))
        
        history['train_spectral_loss'].append(train_losses.get('spectral_loss', 0))
        history['val_spectral_loss'].append(val_losses.get('spectral_loss', 0))
        
        # Get current learning rate
        current_lr = optimizer.param_groups[0]['lr']
        history['learning_rate'].append(current_lr)
        
        # Print epoch summary
        epoch_time = time.time() - epoch_start_time
        print(f"Epoch {epoch}/{num_epochs} - {epoch_time:.2f}s - "
              f"Train Loss: {train_losses.get('combined_loss', 0):.4f} - "
              f"Val Loss: {val_losses.get('combined_loss', 0):.4f} - "
              f"LR: {current_lr:.6f}")
        
        # Save checkpoint
        val_loss = val_losses.get('combined_loss', 0)
        checkpoint_path = os.path.join(checkpoint_dir, f"model_epoch_{epoch}.pt")
        
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_loss': val_loss,
            'train_losses': train_losses,
            'val_losses': val_losses,
            'history': history
        }, checkpoint_path)
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            best_model_path = os.path.join(checkpoint_dir, "best_model.pt")
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss,
                'train_losses': train_losses,
                'val_losses': val_losses,
                'history': history
            }, best_model_path)
            print(f"Best model saved with val_loss: {val_loss:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch}")
                break
        
        # Update learning rate
        if scheduler is not None:
            if isinstance(scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(val_loss)
            else:
                scheduler.step()
    
    # Save final model
    final_model_path = os.path.join(checkpoint_dir, "final_model.pt")
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'val_loss': val_loss,
        'train_losses': train_losses,
        'val_losses': val_losses,
        'history': history
    }, final_model_path)
    
    # Plot and save training history
    plot_training_history(history, os.path.join(checkpoint_dir, "training_history.png"))
    
    # Save history as JSON
    with open(os.path.join(checkpoint_dir, "history.json"), "w") as f:
        json.dump(history, f)
    
    # Load best model
    best_checkpoint = torch.load(best_model_path)
    model.load_state_dict(best_checkpoint['model_state_dict'])
    
    return model, history

def plot_training_history(history: Dict[str, List[float]], save_path: str) -> None:
    """
    Plot training history and save to file.
    
    Args:
        history (Dict[str, List[float]]): Training history
        save_path (str): Path to save the plot
    """
    plt.figure(figsize=(12, 10))
    
    # Plot losses
    plt.subplot(2, 2, 1)
    plt.plot(history['train_loss'], label='Train Loss')
    plt.plot(history['val_loss'], label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    plt.grid(True)
    
    # Plot time domain loss
    plt.subplot(2, 2, 2)
    plt.plot(history['train_time_loss'], label='Train Time Loss')
    plt.plot(history['val_time_loss'], label='Val Time Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Time Domain Loss')
    plt.legend()
    plt.grid(True)
    
    # Plot spectral loss
    plt.subplot(2, 2, 3)
    plt.plot(history['train_spectral_loss'], label='Train Spectral Loss')
    plt.plot(history['val_spectral_loss'], label='Val Spectral Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Spectral Loss')
    plt.legend()
    plt.grid(True)
    
    # Plot learning rate
    plt.subplot(2, 2, 4)
    plt.plot(history['learning_rate'])
    plt.xlabel('Epoch')
    plt.ylabel('Learning Rate')
    plt.title('Learning Rate')
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def main(args):
    """
    Main function for training the model.
    
    Args:
        args: Command line arguments
    """
    # Set random seed
    set_seed(args.seed)
    
    # Set device
    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Create directories
    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs(args.checkpoint_dir, exist_ok=True)
    
    # Initialize dataset manager
    dataset_manager = DatasetManager(args.data_dir)
    
    # Load or download dataset
    if args.dataset_mode == "download":
        # Download from FMA
        audio_files = dataset_manager.download_free_music_archive(
            genre=args.genre,
            limit=args.dataset_size,
            min_duration=args.min_duration,
            max_duration=args.max_duration
        )
    else:
        # Load from local directory
        audio_files = dataset_manager.load_local_audio(args.data_dir)
    
    print(f"Loaded {len(audio_files)} audio files")
    
    # Split into train and test
    train_files, test_files = dataset_manager.create_train_test_split(
        audio_files, test_size=args.test_size
    )
    
    print(f"Train files: {len(train_files)}, Test files: {len(test_files)}")
    
    # Generate lofi dataset if needed
    if args.generate_targets:
        train_target_dir = os.path.join(args.output_dir, "lofi_train")
        test_target_dir = os.path.join(args.output_dir, "lofi_test")
        
        train_target_files = dataset_manager.generate_lofi_dataset(
            train_files, train_target_dir
        )
        
        test_target_files = dataset_manager.generate_lofi_dataset(
            test_files, test_target_dir
        )
    else:
        train_target_files = None
        test_target_files = None
    
    # Precompute features if needed
    if args.precompute_features:
        features_path = os.path.join(args.output_dir, "features.csv")
        
        if not os.path.exists(features_path):
            features_df = dataset_manager.precompute_features(
                audio_files, features_path
            )
        else:
            features_df = pd.read_csv(features_path)
    else:
        features_df = None
    
    # Create dataloaders
    train_loader, val_loader = dataset_manager.create_dataloaders(
        train_files=train_files,
        test_files=test_files,
        train_target_files=train_target_files,
        test_target_files=test_target_files,
        feature_df=features_df,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        sr=args.sample_rate,
        segment_length=args.segment_length,
        augment_train=True
    )
    
    # Determine feature dimension
    feature_dim = None
    if features_df is not None:
        # Exclude file_path column
        feature_dim = features_df.shape[1] - 1
    
    # Create model
    model = LofiNet(
        input_channels=1,
        output_channels=1,
        base_channels=args.base_channels,
        kernel_size=args.kernel_size,
        num_encoder_layers=args.num_encoder_layers,
        num_decoder_layers=args.num_decoder_layers,
        max_channels=args.max_channels,
        feature_dim=feature_dim
    )
    
    # Print model size
    num_params = calculate_model_size(model)
    print(f"Model has {num_params:,} trainable parameters")
    
    # Move model to device
    model = model.to(device)
    
    # Create loss function
    criterion = LofiLoss(
        spectral_weight=args.spectral_weight,
        time_weight=args.time_weight,
        param_weight=args.param_weight,
        use_stft=True
    )
    
    # Create optimizer
    optimizer = optim.Adam(
        model.parameters(),
        lr=args.learning_rate,
        weight_decay=args.weight_decay
    )
    
    # Create learning rate scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode='min',
        factor=0.5,
        patience=3,
        verbose=True
    )
    
    # Train model
    model, history = train_model(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        optimizer=optimizer,
        criterion=criterion,
        device=device,
        num_epochs=args.epochs,
        checkpoint_dir=args.checkpoint_dir,
        patience=args.patience,
        scheduler=scheduler
    )
    
    print("Training complete!")
    
    # Save model architecture and hyperparameters
    config = {
        "model_architecture": {
            "input_channels": 1,
            "output_channels": 1,
            "base_channels": args.base_channels,
            "kernel_size": args.kernel_size,
            "num_encoder_layers": args.num_encoder_layers,
            "num_decoder_layers": args.num_decoder_layers,
            "max_channels": args.max_channels,
            "feature_dim": feature_dim
        },
        "training_params": vars(args),
        "num_parameters": num_params
    }
    
    with open(os.path.join(args.checkpoint_dir, "model_config.json"), "w") as f:
        json.dump(config, f, indent=4)

def parse_args():
    """
    Parse command line arguments.
    
    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Train LofiNet model")
    
    # Dataset parameters
    parser.add_argument("--data_dir", type=str, default="ai_model/data", 
                        help="Directory containing dataset")
    parser.add_argument("--output_dir", type=str, default="ai_model/output", 
                        help="Directory for output files")
    parser.add_argument("--checkpoint_dir", type=str, default="ai_model/models/checkpoints", 
                        help="Directory for model checkpoints")
    parser.add_argument("--dataset_mode", type=str, choices=["local", "download"], default="local", 
                        help="Dataset mode: local or download")
    parser.add_argument("--genre", type=str, default="Electronic", 
                        help="Genre to download (for FMA dataset)")
    parser.add_argument("--dataset_size", type=int, default=100, 
                        help="Number of tracks to download")
    parser.add_argument("--min_duration", type=float, default=30.0, 
                        help="Minimum track duration in seconds")
    parser.add_argument("--max_duration", type=float, default=300.0, 
                        help="Maximum track duration in seconds")
    parser.add_argument("--test_size", type=float, default=0.2, 
                        help="Test set proportion")
    parser.add_argument("--generate_targets", action="store_true", 
                        help="Generate lofi targets using rule-based processing")
    parser.add_argument("--precompute_features", action="store_true", 
                        help="Precompute audio features")
    
    # Audio processing parameters
    parser.add_argument("--sample_rate", type=int, default=22050, 
                        help="Audio sample rate")
    parser.add_argument("--segment_length", type=int, default=22050 * 5, 
                        help="Audio segment length in samples")
    
    # Model parameters
    parser.add_argument("--base_channels", type=int, default=32, 
                        help="Base number of channels in the model")
    parser.add_argument("--kernel_size", type=int, default=3, 
                        help="Kernel size for convolutions")
    parser.add_argument("--num_encoder_layers", type=int, default=6, 
                        help="Number of encoder layers")
    parser.add_argument("--num_decoder_layers", type=int, default=6, 
                        help="Number of decoder layers")
    parser.add_argument("--max_channels", type=int, default=256, 
                        help="Maximum number of channels in the model")
    
    # Training parameters
    parser.add_argument("--batch_size", type=int, default=16, 
                        help="Batch size")
    parser.add_argument("--epochs", type=int, default=50, 
                        help="Number of epochs")
    parser.add_argument("--learning_rate", type=float, default=0.0001, 
                        help="Learning rate")
    parser.add_argument("--weight_decay", type=float, default=1e-5, 
                        help="Weight decay")
    parser.add_argument("--patience", type=int, default=10, 
                        help="Early stopping patience")
    parser.add_argument("--spectral_weight", type=float, default=0.5, 
                        help="Weight for spectral loss")
    parser.add_argument("--time_weight", type=float, default=0.3, 
                        help="Weight for time domain loss")
    parser.add_argument("--param_weight", type=float, default=0.2, 
                        help="Weight for parameter prediction loss")
    
    # Misc parameters
    parser.add_argument("--device", type=str, default="cuda", 
                        help="Device for training (cuda or cpu)")
    parser.add_argument("--num_workers", type=int, default=4, 
                        help="Number of dataloader workers")
    parser.add_argument("--seed", type=int, default=42, 
                        help="Random seed")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    main(args)