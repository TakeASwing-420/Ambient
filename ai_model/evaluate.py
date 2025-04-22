import os
import torch
import numpy as np
import matplotlib.pyplot as plt
import argparse
import json
import librosa
import librosa.display
import soundfile as sf
from typing import Dict, Tuple, List, Optional, Any, Union
import time
from tqdm import tqdm
import pandas as pd

from ai_model.models.lofi_model import LofiNet
from ai_model.utils.audio_utils import AudioProcessor, visualize_waveform, visualize_spectrogram

def load_model(checkpoint_path: str, config_path: Optional[str] = None, device: torch.device = torch.device("cpu")) -> LofiNet:
    """
    Load a trained model from checkpoint.
    
    Args:
        checkpoint_path (str): Path to the model checkpoint
        config_path (Optional[str]): Path to the model configuration
        device (torch.device): Device to load the model on
        
    Returns:
        LofiNet: Loaded model
    """
    # Load configuration if provided
    if config_path is not None and os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = json.load(f)
        
        # Extract model architecture
        arch = config["model_architecture"]
        
        # Create model instance
        model = LofiNet(
            input_channels=arch.get("input_channels", 1),
            output_channels=arch.get("output_channels", 1),
            base_channels=arch.get("base_channels", 32),
            kernel_size=arch.get("kernel_size", 3),
            num_encoder_layers=arch.get("num_encoder_layers", 6),
            num_decoder_layers=arch.get("num_decoder_layers", 6),
            max_channels=arch.get("max_channels", 256),
            feature_dim=arch.get("feature_dim", None)
        )
    else:
        # Create default model (must match saved architecture)
        print("No config file found. Creating default model architecture.")
        model = LofiNet()
    
    # Load checkpoint
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    
    # Move to device and set to evaluation mode
    model = model.to(device)
    model.eval()
    
    return model

def apply_model_to_audio(
    model: LofiNet,
    audio_path: str,
    output_path: str,
    device: torch.device,
    sr: int = 22050,
    segment_length: int = 22050 * 5,
    overlap: float = 0.1,
    features: Optional[Dict[str, float]] = None
) -> Tuple[np.ndarray, int]:
    """
    Apply the trained model to audio.
    
    Args:
        model (LofiNet): The trained model
        audio_path (str): Path to input audio file
        output_path (str): Path to save output audio file
        device (torch.device): Device to run inference on
        sr (int): Sample rate
        segment_length (int): Length of audio segments in samples
        overlap (float): Overlap between segments (0-1)
        features (Optional[Dict[str, float]]): Audio features for conditioning
        
    Returns:
        Tuple[np.ndarray, int]: Processed audio data and sample rate
    """
    audio_processor = AudioProcessor(sr=sr)
    
    # Load audio
    y, sr = audio_processor.load_audio(audio_path)
    
    # Extract features if not provided
    feature_tensor = None
    if features is None:
        features = audio_processor.extract_features(y, sr)
        print("Extracted features:", features)
    
    # Convert features to tensor if feature conditioning is used
    if model.param_predictor is not None:
        # Extract feature values and convert to tensor
        feature_values = [v for k, v in features.items() if k != "file_path"]
        feature_tensor = torch.FloatTensor(feature_values).unsqueeze(0).to(device)
    
    # Calculate hop length based on overlap
    hop_length = int(segment_length * (1 - overlap))
    
    # Split audio into overlapping segments
    segments = []
    for i in range(0, len(y), hop_length):
        segment = y[i:i + segment_length]
        
        # Pad if necessary
        if len(segment) < segment_length:
            segment = np.pad(segment, (0, segment_length - len(segment)))
        
        segments.append(segment)
    
    # Process each segment
    processed_segments = []
    
    with torch.no_grad():
        for segment in tqdm(segments, desc="Processing segments"):
            # Convert to tensor
            segment_tensor = torch.FloatTensor(segment).unsqueeze(0).unsqueeze(0).to(device)
            
            # Forward pass
            if feature_tensor is not None:
                outputs = model(segment_tensor, feature_tensor)
            else:
                outputs = model(segment_tensor)
            
            # Get processed audio
            processed_segment = outputs["output"].squeeze().cpu().numpy()
            processed_segments.append(processed_segment)
    
    # Overlap-add the segments
    processed_audio = np.zeros(len(y))
    window = np.hanning(segment_length)
    
    for i, segment in enumerate(processed_segments):
        # Calculate position
        start = i * hop_length
        end = start + segment_length
        
        # Apply window
        windowed_segment = segment * window
        
        # Overlap-add
        if end <= len(processed_audio):
            processed_audio[start:end] += windowed_segment
        else:
            processed_audio[start:] += windowed_segment[:len(processed_audio) - start]
    
    # Normalize
    processed_audio = librosa.util.normalize(processed_audio)
    
    # Save output
    sf.write(output_path, processed_audio, sr)
    
    return processed_audio, sr

def evaluate_model(
    model: LofiNet,
    test_files: List[str],
    output_dir: str,
    device: torch.device,
    sr: int = 22050,
    original_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluate the model on test files.
    
    Args:
        model (LofiNet): The trained model
        test_files (List[str]): List of test audio file paths
        output_dir (str): Directory to save processed files
        device (torch.device): Device to run inference on
        sr (int): Sample rate
        original_dir (Optional[str]): Directory with original (non-lofi) files for comparison
        
    Returns:
        Dict[str, Any]: Evaluation metrics
    """
    os.makedirs(output_dir, exist_ok=True)
    
    audio_processor = AudioProcessor(sr=sr)
    
    # Initialize metrics
    metrics = {
        "processing_time": [],
        "spectral_contrast": [],
        "spectral_centroid_ratio": [],
        "zero_crossing_rate_ratio": [],
        "rms_ratio": []
    }
    
    # Process each test file
    for i, test_file in enumerate(tqdm(test_files, desc="Evaluating")):
        # Get filename
        filename = os.path.basename(test_file)
        output_path = os.path.join(output_dir, f"lofi_{filename}")
        
        # Measure processing time
        start_time = time.time()
        
        # Apply model
        processed_audio, sr = apply_model_to_audio(
            model, test_file, output_path, device, sr
        )
        
        # Record processing time
        processing_time = time.time() - start_time
        metrics["processing_time"].append(processing_time)
        
        # Load original audio
        y_orig, _ = audio_processor.load_audio(test_file)
        
        # Extract features for comparison
        feat_orig = audio_processor.extract_features(y_orig, sr)
        feat_proc = audio_processor.extract_features(processed_audio, sr)
        
        # Calculate metrics
        metrics["spectral_contrast"].append(
            abs(feat_proc["contrast_mean"] - feat_orig["contrast_mean"])
        )
        
        metrics["spectral_centroid_ratio"].append(
            feat_proc["spectral_centroid_mean"] / feat_orig["spectral_centroid_mean"]
            if feat_orig["spectral_centroid_mean"] > 0 else 1.0
        )
        
        metrics["zero_crossing_rate_ratio"].append(
            feat_proc["zero_crossing_rate"] / feat_orig["zero_crossing_rate"]
            if feat_orig["zero_crossing_rate"] > 0 else 1.0
        )
        
        metrics["rms_ratio"].append(
            feat_proc["rms_mean"] / feat_orig["rms_mean"]
            if feat_orig["rms_mean"] > 0 else 1.0
        )
        
        # Create visualizations (for first 5 files only)
        if i < 5:
            viz_dir = os.path.join(output_dir, "visualizations")
            os.makedirs(viz_dir, exist_ok=True)
            
            # Waveform visualizations
            visualize_waveform(
                y_orig, sr, os.path.join(viz_dir, f"{i}_original_waveform.png")
            )
            visualize_waveform(
                processed_audio, sr, os.path.join(viz_dir, f"{i}_lofi_waveform.png")
            )
            
            # Spectrogram visualizations
            visualize_spectrogram(
                y_orig, sr, os.path.join(viz_dir, f"{i}_original_spectrogram.png")
            )
            visualize_spectrogram(
                processed_audio, sr, os.path.join(viz_dir, f"{i}_lofi_spectrogram.png")
            )
    
    # Calculate aggregate metrics
    agg_metrics = {
        "avg_processing_time": np.mean(metrics["processing_time"]),
        "std_processing_time": np.std(metrics["processing_time"]),
        "avg_spectral_contrast": np.mean(metrics["spectral_contrast"]),
        "avg_spectral_centroid_ratio": np.mean(metrics["spectral_centroid_ratio"]),
        "avg_zero_crossing_rate_ratio": np.mean(metrics["zero_crossing_rate_ratio"]),
        "avg_rms_ratio": np.mean(metrics["rms_ratio"])
    }
    
    # Save metrics as JSON
    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(agg_metrics, f, indent=4)
    
    print("Evaluation metrics:")
    for key, value in agg_metrics.items():
        print(f"{key}: {value:.4f}")
    
    return agg_metrics

def benchmark_model(
    model: LofiNet,
    device: torch.device,
    input_sizes: List[int] = [22050, 44100, 88200, 176400],
    batch_sizes: List[int] = [1, 4, 8, 16],
    feature_dim: Optional[int] = None,
    warmup_runs: int = 10,
    benchmark_runs: int = 50
) -> Dict[str, Any]:
    """
    Benchmark model performance.
    
    Args:
        model (LofiNet): The model to benchmark
        device (torch.device): Device to run benchmark on
        input_sizes (List[int]): List of input sizes to test
        batch_sizes (List[int]): List of batch sizes to test
        feature_dim (Optional[int]): Feature dimension for conditioning
        warmup_runs (int): Number of warmup runs
        benchmark_runs (int): Number of benchmark runs
        
    Returns:
        Dict[str, Any]: Benchmark results
    """
    model.eval()
    
    # Initialize results
    results = {
        "input_size": [],
        "batch_size": [],
        "avg_time": [],
        "throughput": []
    }
    
    # Benchmark for each input size and batch size
    for input_size in input_sizes:
        for batch_size in batch_sizes:
            print(f"Benchmarking input_size={input_size}, batch_size={batch_size}")
            
            # Create random input
            x = torch.randn(batch_size, 1, input_size).to(device)
            
            # Create random features if needed
            features = None
            if feature_dim is not None:
                features = torch.randn(batch_size, feature_dim).to(device)
            
            # Warmup
            with torch.no_grad():
                for _ in range(warmup_runs):
                    _ = model(x, features)
            
            # Benchmark
            torch.cuda.synchronize() if device.type == "cuda" else None
            start_time = time.time()
            
            with torch.no_grad():
                for _ in range(benchmark_runs):
                    _ = model(x, features)
            
            torch.cuda.synchronize() if device.type == "cuda" else None
            end_time = time.time()
            
            # Calculate metrics
            total_time = end_time - start_time
            avg_time = total_time / benchmark_runs
            samples_per_second = batch_size / avg_time
            
            # Record results
            results["input_size"].append(input_size)
            results["batch_size"].append(batch_size)
            results["avg_time"].append(avg_time)
            results["throughput"].append(samples_per_second)
            
            print(f"  Avg time: {avg_time:.4f}s, Throughput: {samples_per_second:.2f} samples/sec")
    
    # Convert to DataFrame for better visualization
    df = pd.DataFrame(results)
    
    # Create visualization
    plt.figure(figsize=(12, 8))
    
    for batch_size in batch_sizes:
        subset = df[df["batch_size"] == batch_size]
        plt.plot(
            subset["input_size"], 
            subset["throughput"], 
            marker="o", 
            label=f"Batch Size {batch_size}"
        )
    
    plt.xlabel("Input Size (samples)")
    plt.ylabel("Throughput (samples/sec)")
    plt.title("Model Throughput by Input Size and Batch Size")
    plt.grid(True)
    plt.legend()
    plt.xscale("log", base=2)
    plt.tight_layout()
    
    # Save visualization
    plt.savefig("benchmark_results.png")
    
    # Save results
    df.to_csv("benchmark_results.csv", index=False)
    
    return results

def main(args):
    """
    Main function for evaluating the model.
    
    Args:
        args: Command line arguments
    """
    # Set device
    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load model
    model = load_model(args.model_path, args.config_path, device)
    print("Model loaded successfully!")
    
    # Determine evaluation mode
    if args.mode == "single":
        # Process a single file
        output_path = os.path.join(args.output_dir, f"lofi_{os.path.basename(args.input_path)}")
        
        processed_audio, sr = apply_model_to_audio(
            model, args.input_path, output_path, device, 
            sr=args.sample_rate, segment_length=args.segment_length
        )
        
        print(f"Processed audio saved to {output_path}")
        
        # Create visualizations
        viz_dir = os.path.join(args.output_dir, "visualizations")
        os.makedirs(viz_dir, exist_ok=True)
        
        # Load original audio
        audio_processor = AudioProcessor(sr=args.sample_rate)
        y_orig, sr = audio_processor.load_audio(args.input_path)
        
        # Waveform visualizations
        visualize_waveform(
            y_orig, sr, os.path.join(viz_dir, "original_waveform.png")
        )
        visualize_waveform(
            processed_audio, sr, os.path.join(viz_dir, "lofi_waveform.png")
        )
        
        # Spectrogram visualizations
        visualize_spectrogram(
            y_orig, sr, os.path.join(viz_dir, "original_spectrogram.png")
        )
        visualize_spectrogram(
            processed_audio, sr, os.path.join(viz_dir, "lofi_spectrogram.png")
        )
    
    elif args.mode == "directory":
        # Process all files in directory
        import glob
        
        # Get all audio files
        audio_files = []
        for ext in [".mp3", ".wav", ".flac", ".ogg"]:
            audio_files.extend(glob.glob(os.path.join(args.input_path, f"*{ext}")))
        
        print(f"Found {len(audio_files)} audio files in {args.input_path}")
        
        # Evaluate model
        metrics = evaluate_model(
            model, audio_files, args.output_dir, device, 
            sr=args.sample_rate
        )
    
    elif args.mode == "benchmark":
        # Benchmark model performance
        print("Running benchmark...")
        
        # Get feature dimension from config if available
        feature_dim = None
        if args.config_path and os.path.exists(args.config_path):
            with open(args.config_path, "r") as f:
                config = json.load(f)
            feature_dim = config["model_architecture"].get("feature_dim", None)
        
        # Run benchmark
        results = benchmark_model(
            model, device, 
            input_sizes=args.benchmark_sizes,
            batch_sizes=args.benchmark_batches,
            feature_dim=feature_dim
        )
        
        print("Benchmark complete!")

def parse_args():
    """
    Parse command line arguments.
    
    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Evaluate LofiNet model")
    
    # Model parameters
    parser.add_argument("--model_path", type=str, required=True, 
                        help="Path to the model checkpoint")
    parser.add_argument("--config_path", type=str, default=None, 
                        help="Path to the model configuration")
    
    # Evaluation mode
    parser.add_argument("--mode", type=str, choices=["single", "directory", "benchmark"], default="single", 
                        help="Evaluation mode")
    
    # Input/output paths
    parser.add_argument("--input_path", type=str, required=True, 
                        help="Path to input file or directory")
    parser.add_argument("--output_dir", type=str, default="ai_model/output/evaluation", 
                        help="Directory for output files")
    
    # Audio processing parameters
    parser.add_argument("--sample_rate", type=int, default=22050, 
                        help="Audio sample rate")
    parser.add_argument("--segment_length", type=int, default=22050 * 5, 
                        help="Audio segment length in samples")
    
    # Benchmark parameters
    parser.add_argument("--benchmark_sizes", type=int, nargs="+", 
                        default=[22050, 44100, 88200, 176400], 
                        help="Input sizes for benchmarking")
    parser.add_argument("--benchmark_batches", type=int, nargs="+", 
                        default=[1, 4, 8, 16], 
                        help="Batch sizes for benchmarking")
    
    # Misc parameters
    parser.add_argument("--device", type=str, default="cuda", 
                        help="Device for inference (cuda or cpu)")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    main(args)