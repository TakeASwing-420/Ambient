import os
import sys
import time
import torch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import argparse
import json
import librosa
import soundfile as sf
from typing import Dict, List, Any, Optional, Tuple
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ai_model.models.lofi_model import LofiNet
from ai_model.utils.audio_utils import AudioProcessor
from ai_model.evaluate import load_model, apply_model_to_audio
from ai_model.inference import LofiGenerator

def benchmark_model_inference(
    model: LofiNet,
    device: torch.device,
    input_sizes: List[int] = [22050, 44100, 88200, 176400],
    batch_sizes: List[int] = [1, 4, 8, 16],
    feature_dim: Optional[int] = None,
    warmup_runs: int = 10,
    benchmark_runs: int = 50,
    output_dir: str = "benchmark_results"
) -> Dict[str, Any]:
    """
    Benchmark model inference performance.
    
    Args:
        model (LofiNet): The model to benchmark
        device (torch.device): Device to run benchmark on
        input_sizes (List[int]): List of input sizes to test
        batch_sizes (List[int]): List of batch sizes to test
        feature_dim (Optional[int]): Feature dimension for conditioning
        warmup_runs (int): Number of warmup runs
        benchmark_runs (int): Number of benchmark runs
        output_dir (str): Directory to save benchmark results
        
    Returns:
        Dict[str, Any]: Benchmark results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    model.eval()
    
    # Initialize results
    results = {
        "input_size": [],
        "batch_size": [],
        "avg_time": [],
        "throughput": [],
        "memory_usage": []
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
            
            # Record initial memory
            if device.type == "cuda":
                torch.cuda.empty_cache()
                initial_memory = torch.cuda.memory_allocated() / (1024 * 1024)  # MB
            
            # Warmup
            with torch.no_grad():
                for _ in range(warmup_runs):
                    _ = model(x, features)
            
            # Benchmark inference time
            torch.cuda.synchronize() if device.type == "cuda" else None
            start_time = time.time()
            
            with torch.no_grad():
                for _ in range(benchmark_runs):
                    _ = model(x, features)
            
            torch.cuda.synchronize() if device.type == "cuda" else None
            end_time = time.time()
            
            # Record peak memory
            if device.type == "cuda":
                memory_usage = torch.cuda.max_memory_allocated() / (1024 * 1024) - initial_memory  # MB
            else:
                memory_usage = 0  # Not tracked for CPU
            
            # Calculate metrics
            total_time = end_time - start_time
            avg_time = total_time / benchmark_runs
            samples_per_second = batch_size / avg_time
            
            # Record results
            results["input_size"].append(input_size)
            results["batch_size"].append(batch_size)
            results["avg_time"].append(avg_time)
            results["throughput"].append(samples_per_second)
            results["memory_usage"].append(memory_usage)
            
            print(f"  Avg time: {avg_time*1000:.2f}ms, Throughput: {samples_per_second:.2f} samples/sec")
            if device.type == "cuda":
                print(f"  Memory usage: {memory_usage:.2f} MB")
    
    # Convert to DataFrame for better visualization
    df = pd.DataFrame(results)
    
    # Save results as CSV
    csv_path = os.path.join(output_dir, "inference_benchmark.csv")
    df.to_csv(csv_path, index=False)
    
    # Create visualizations
    fig, axs = plt.subplots(2, 1, figsize=(12, 10))
    
    # Plot inference time
    for batch_size in batch_sizes:
        subset = df[df["batch_size"] == batch_size]
        axs[0].plot(
            subset["input_size"], 
            subset["avg_time"] * 1000,  # Convert to ms
            marker="o", 
            label=f"Batch Size {batch_size}"
        )
    
    axs[0].set_xlabel("Input Size (samples)")
    axs[0].set_ylabel("Inference Time (ms)")
    axs[0].set_title("Model Inference Time by Input Size and Batch Size")
    axs[0].grid(True)
    axs[0].legend()
    axs[0].set_xscale("log", base=2)
    
    # Plot throughput
    for batch_size in batch_sizes:
        subset = df[df["batch_size"] == batch_size]
        axs[1].plot(
            subset["input_size"], 
            subset["throughput"], 
            marker="o", 
            label=f"Batch Size {batch_size}"
        )
    
    axs[1].set_xlabel("Input Size (samples)")
    axs[1].set_ylabel("Throughput (samples/sec)")
    axs[1].set_title("Model Throughput by Input Size and Batch Size")
    axs[1].grid(True)
    axs[1].legend()
    axs[1].set_xscale("log", base=2)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "inference_benchmark.png"))
    
    # If CUDA is available, create memory usage plot
    if device.type == "cuda":
        plt.figure(figsize=(12, 6))
        
        for batch_size in batch_sizes:
            subset = df[df["batch_size"] == batch_size]
            plt.plot(
                subset["input_size"], 
                subset["memory_usage"], 
                marker="o", 
                label=f"Batch Size {batch_size}"
            )
        
        plt.xlabel("Input Size (samples)")
        plt.ylabel("Memory Usage (MB)")
        plt.title("Model Memory Usage by Input Size and Batch Size")
        plt.grid(True)
        plt.legend()
        plt.xscale("log", base=2)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "memory_benchmark.png"))
    
    return results

def benchmark_audio_processing(
    processor: AudioProcessor,
    input_durations: List[float] = [1.0, 5.0, 10.0, 30.0, 60.0],
    sr: int = 22050,
    benchmark_runs: int = 10,
    output_dir: str = "benchmark_results"
) -> Dict[str, Any]:
    """
    Benchmark audio processing performance.
    
    Args:
        processor (AudioProcessor): The audio processor to benchmark
        input_durations (List[float]): List of input durations in seconds
        sr (int): Sample rate
        benchmark_runs (int): Number of benchmark runs
        output_dir (str): Directory to save benchmark results
        
    Returns:
        Dict[str, Any]: Benchmark results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize results
    results = {
        "duration": [],
        "input_size": [],
        "feature_extraction_time": [],
        "apply_effects_time": [],
        "total_processing_time": []
    }
    
    # Benchmark for each input duration
    for duration in input_durations:
        print(f"Benchmarking duration={duration}s")
        
        # Create test audio
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        y = 0.5 * np.sin(2 * np.pi * 440 * t)
        
        # Calculate input size
        input_size = len(y)
        
        # Benchmark feature extraction
        feature_times = []
        for _ in range(benchmark_runs):
            start_time = time.time()
            features = processor.extract_features(y, sr)
            feature_times.append(time.time() - start_time)
        
        # Benchmark effect application
        effect_times = []
        for _ in range(benchmark_runs):
            start_time = time.time()
            y_processed = processor.apply_lofi_effects(
                y, sr,
                chill_level=70.0,
                beat_intensity=50.0,
                vintage_effect=30.0,
                mood="relaxed"
            )
            effect_times.append(time.time() - start_time)
        
        # Calculate average times
        avg_feature_time = np.mean(feature_times)
        avg_effect_time = np.mean(effect_times)
        avg_total_time = avg_feature_time + avg_effect_time
        
        # Record results
        results["duration"].append(duration)
        results["input_size"].append(input_size)
        results["feature_extraction_time"].append(avg_feature_time)
        results["apply_effects_time"].append(avg_effect_time)
        results["total_processing_time"].append(avg_total_time)
        
        print(f"  Feature extraction: {avg_feature_time*1000:.2f}ms")
        print(f"  Effect application: {avg_effect_time*1000:.2f}ms")
        print(f"  Total processing: {avg_total_time*1000:.2f}ms")
    
    # Convert to DataFrame for better visualization
    df = pd.DataFrame(results)
    
    # Save results as CSV
    csv_path = os.path.join(output_dir, "audio_processing_benchmark.csv")
    df.to_csv(csv_path, index=False)
    
    # Create visualizations
    plt.figure(figsize=(12, 6))
    
    plt.plot(
        df["duration"], 
        df["feature_extraction_time"] * 1000,  # Convert to ms
        marker="o", 
        label="Feature Extraction"
    )
    plt.plot(
        df["duration"], 
        df["apply_effects_time"] * 1000,  # Convert to ms
        marker="o", 
        label="Effect Application"
    )
    plt.plot(
        df["duration"], 
        df["total_processing_time"] * 1000,  # Convert to ms
        marker="o", 
        label="Total Processing"
    )
    
    plt.xlabel("Audio Duration (seconds)")
    plt.ylabel("Processing Time (ms)")
    plt.title("Audio Processing Time by Duration")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "audio_processing_benchmark.png"))
    
    return results

def benchmark_end_to_end(
    generator: LofiGenerator,
    input_durations: List[float] = [1.0, 5.0, 10.0, 30.0, 60.0],
    sr: int = 22050,
    benchmark_runs: int = 5,
    output_dir: str = "benchmark_results"
) -> Dict[str, Any]:
    """
    Benchmark end-to-end lofi generation.
    
    Args:
        generator (LofiGenerator): The lofi generator to benchmark
        input_durations (List[float]): List of input durations in seconds
        sr (int): Sample rate
        benchmark_runs (int): Number of benchmark runs
        output_dir (str): Directory to save benchmark results
        
    Returns:
        Dict[str, Any]: Benchmark results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize results
    results = {
        "duration": [],
        "input_size": [],
        "generation_time": [],
        "processing_speed": []  # x real-time speed
    }
    
    # Temporary directory for test files
    temp_dir = os.path.join(output_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Benchmark for each input duration
        for duration in input_durations:
            print(f"Benchmarking duration={duration}s")
            
            # Create test audio
            t = np.linspace(0, duration, int(sr * duration), endpoint=False)
            y = 0.5 * np.sin(2 * np.pi * 440 * t)
            
            # Calculate input size
            input_size = len(y)
            
            # Create input file
            input_path = os.path.join(temp_dir, f"input_{duration:.1f}s.wav")
            sf.write(input_path, y, sr)
            
            # Output path
            output_path = os.path.join(temp_dir, f"output_{duration:.1f}s.wav")
            
            # Benchmark generation
            generation_times = []
            for i in range(benchmark_runs):
                print(f"  Run {i+1}/{benchmark_runs}")
                
                start_time = time.time()
                generator.generate(input_path, output_path)
                generation_times.append(time.time() - start_time)
            
            # Calculate average time
            avg_generation_time = np.mean(generation_times)
            
            # Calculate processing speed (x real-time)
            processing_speed = duration / avg_generation_time
            
            # Record results
            results["duration"].append(duration)
            results["input_size"].append(input_size)
            results["generation_time"].append(avg_generation_time)
            results["processing_speed"].append(processing_speed)
            
            print(f"  Generation time: {avg_generation_time:.2f}s")
            print(f"  Processing speed: {processing_speed:.2f}x real-time")
    
    finally:
        # Clean up
        import shutil
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
    
    # Convert to DataFrame for better visualization
    df = pd.DataFrame(results)
    
    # Save results as CSV
    csv_path = os.path.join(output_dir, "end_to_end_benchmark.csv")
    df.to_csv(csv_path, index=False)
    
    # Create visualizations
    fig, axs = plt.subplots(2, 1, figsize=(12, 10))
    
    # Plot generation time
    axs[0].plot(
        df["duration"], 
        df["generation_time"],
        marker="o"
    )
    axs[0].set_xlabel("Audio Duration (seconds)")
    axs[0].set_ylabel("Generation Time (seconds)")
    axs[0].set_title("Lofi Generation Time by Duration")
    axs[0].grid(True)
    
    # Plot processing speed
    axs[1].plot(
        df["duration"], 
        df["processing_speed"],
        marker="o"
    )
    axs[1].set_xlabel("Audio Duration (seconds)")
    axs[1].set_ylabel("Processing Speed (x real-time)")
    axs[1].set_title("Lofi Generation Speed by Duration")
    axs[1].grid(True)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "end_to_end_benchmark.png"))
    
    return results

def main(args):
    """
    Main function for benchmarking.
    
    Args:
        args: Command line arguments
    """
    # Set device
    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Benchmark based on mode
    if args.mode == "model":
        # Load model
        model = load_model(args.model_path, args.config_path, device)
        print("Model loaded successfully!")
        
        # Get feature dimension from config if available
        feature_dim = None
        if args.config_path and os.path.exists(args.config_path):
            with open(args.config_path, "r") as f:
                config = json.load(f)
            feature_dim = config["model_architecture"].get("feature_dim", None)
        
        # Run benchmark
        results = benchmark_model_inference(
            model, device, 
            input_sizes=args.input_sizes,
            batch_sizes=args.batch_sizes,
            feature_dim=feature_dim,
            warmup_runs=args.warmup_runs,
            benchmark_runs=args.benchmark_runs,
            output_dir=args.output_dir
        )
    
    elif args.mode == "processor":
        # Create audio processor
        processor = AudioProcessor(sr=args.sample_rate)
        
        # Run benchmark
        results = benchmark_audio_processing(
            processor,
            input_durations=args.input_durations,
            sr=args.sample_rate,
            benchmark_runs=args.benchmark_runs,
            output_dir=args.output_dir
        )
    
    elif args.mode == "end_to_end":
        # Create lofi generator
        generator = LofiGenerator(
            model_path=args.model_path,
            config_path=args.config_path,
            device=args.device,
            sr=args.sample_rate,
            segment_length=args.sample_rate * 5,  # 5-second segments
            overlap=0.1
        )
        
        # Run benchmark
        results = benchmark_end_to_end(
            generator,
            input_durations=args.input_durations,
            sr=args.sample_rate,
            benchmark_runs=args.benchmark_runs,
            output_dir=args.output_dir
        )
    
    print("Benchmark complete!")

def parse_args():
    """
    Parse command line arguments.
    
    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Benchmark LofiNet model and processing")
    
    # Benchmark mode
    parser.add_argument("--mode", type=str, choices=["model", "processor", "end_to_end"], default="model", 
                        help="Benchmark mode: model, processor, or end_to_end")
    
    # Model parameters
    parser.add_argument("--model_path", type=str, default=None, 
                        help="Path to the model checkpoint")
    parser.add_argument("--config_path", type=str, default=None, 
                        help="Path to the model configuration")
    
    # Benchmark parameters
    parser.add_argument("--input_sizes", type=int, nargs="+", 
                        default=[22050, 44100, 88200, 176400, 352800], 
                        help="Input sizes for benchmarking (in samples)")
    parser.add_argument("--batch_sizes", type=int, nargs="+", 
                        default=[1, 4, 8, 16], 
                        help="Batch sizes for benchmarking")
    parser.add_argument("--input_durations", type=float, nargs="+", 
                        default=[1.0, 5.0, 10.0, 30.0, 60.0], 
                        help="Input durations for benchmarking (in seconds)")
    parser.add_argument("--warmup_runs", type=int, default=5, 
                        help="Number of warmup runs")
    parser.add_argument("--benchmark_runs", type=int, default=20, 
                        help="Number of benchmark runs")
    
    # Output parameters
    parser.add_argument("--output_dir", type=str, default="benchmark_results", 
                        help="Directory for output files")
    
    # Misc parameters
    parser.add_argument("--device", type=str, default="cuda", 
                        help="Device for benchmarking (cuda or cpu)")
    parser.add_argument("--sample_rate", type=int, default=22050, 
                        help="Audio sample rate")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # Require model_path for model and end_to_end modes
    if args.mode in ["model", "end_to_end"] and args.model_path is None:
        raise ValueError(f"--model_path is required for {args.mode} mode")
    
    main(args)