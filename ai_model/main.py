import os
import sys
import argparse
import json
import torch
import numpy as np
import time
import tempfile
import shutil
from typing import Dict, Any, Optional, List, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ai_model.inference import LofiGenerator
from ai_model.utils.audio_utils import AudioProcessor
from ai_model.train import main as train_main
from ai_model.evaluate import main as evaluate_main

class LofiAI:
    """
    Main interface class for the Lofi AI system.
    """
    def __init__(
        self, 
        model_dir: str = "ai_model/models",
        use_neural_model: bool = False,
        device: Optional[str] = None,
        sr: int = 22050,
        segment_length: int = 22050 * 5
    ):
        """
        Initialize the LofiAI system.
        
        Args:
            model_dir (str): Directory containing model checkpoints
            use_neural_model (bool): Whether to use neural model for generation
            device (Optional[str]): Device to run inference on
            sr (int): Sample rate
            segment_length (int): Length of audio segments in samples
        """
        self.model_dir = model_dir
        self.use_neural_model = use_neural_model
        self.audio_processor = AudioProcessor(sr=sr)
        self.sr = sr
        self.segment_length = segment_length
        
        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Initialize generator
        if self.use_neural_model:
            # Find best model checkpoint
            model_path = os.path.join(model_dir, "best_model.pt")
            config_path = os.path.join(model_dir, "model_config.json")
            
            if os.path.exists(model_path) and os.path.exists(config_path):
                self.generator = LofiGenerator(
                    model_path=model_path,
                    config_path=config_path,
                    device=self.device,
                    sr=sr,
                    segment_length=segment_length
                )
                self.generator.use_nn_model = True
                print(f"Using neural model from {model_path}")
            else:
                print("Neural model not found. Falling back to rule-based processing.")
                self.use_neural_model = False
                self.generator = None
        
        if not self.use_neural_model:
            # Use processor directly (no neural model)
            self.generator = None
    
    def process_audio(
        self, 
        input_path: str, 
        output_path: str, 
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process audio to generate lofi version.
        
        Args:
            input_path (str): Path to input audio file
            output_path (str): Path to save output audio file
            parameters (Optional[Dict[str, Any]]): Parameters for lofi generation
            
        Returns:
            Dict[str, Any]: Results including timing and parameters used
        """
        start_time = time.time()
        
        # Analyze audio if parameters not provided
        if parameters is None:
            # Load audio and extract features
            y, sr = self.audio_processor.load_audio(input_path)
            features = self.audio_processor.extract_features(y, sr)
            
            # Get recommended parameters
            parameters = self.audio_processor.analyze_audio_mood(features)
        
        # Process with neural model if available
        if self.use_neural_model and self.generator is not None:
            try:
                self.generator.generate(input_path, output_path, parameters)
            except Exception as e:
                print(f"Error using neural model: {e}")
                print("Falling back to rule-based processing.")
                self._process_with_rules(input_path, output_path, parameters)
        else:
            # Use rule-based processing
            self._process_with_rules(input_path, output_path, parameters)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        return {
            'input_path': input_path,
            'output_path': output_path,
            'parameters': parameters,
            'processing_time': processing_time
        }
    
    def _process_with_rules(
        self, 
        input_path: str, 
        output_path: str, 
        parameters: Dict[str, Any]
    ) -> None:
        """
        Process audio using rule-based effects.
        
        Args:
            input_path (str): Path to input audio file
            output_path (str): Path to save output audio file
            parameters (Dict[str, Any]): Parameters for lofi generation
        """
        # Load audio
        y, sr = self.audio_processor.load_audio(input_path)
        
        # Apply lofi effects
        y_lofi = self.audio_processor.apply_lofi_effects(
            y, sr,
            chill_level=parameters['chill_level'],
            beat_intensity=parameters['beat_intensity'],
            vintage_effect=parameters['vintage_effect'],
            mood=parameters['mood']
        )
        
        # Save output
        self.audio_processor.save_audio(y_lofi, sr, output_path)
    
    def analyze_audio(self, input_path: str) -> Dict[str, Any]:
        """
        Analyze audio and suggest parameters.
        
        Args:
            input_path (str): Path to input audio file
            
        Returns:
            Dict[str, Any]: Analysis results including suggested parameters
        """
        # Load audio and extract features
        y, sr = self.audio_processor.load_audio(input_path)
        features = self.audio_processor.extract_features(y, sr)
        
        # Get recommended parameters
        parameters = self.audio_processor.analyze_audio_mood(features)
        
        return {
            'input_path': input_path,
            'parameters': parameters,
            'features': {k: v for k, v in features.items() if k != 'file_path'}
        }
    
    def train_model(self, args_list: List[str]) -> None:
        """
        Train the neural model.
        
        Args:
            args_list (List[str]): Command line arguments for training
        """
        # Parse arguments and run training
        args = train_main.parse_args(args_list)
        train_main.main(args)
    
    def evaluate_model(self, args_list: List[str]) -> None:
        """
        Evaluate the neural model.
        
        Args:
            args_list (List[str]): Command line arguments for evaluation
        """
        # Parse arguments and run evaluation
        args = evaluate_main.parse_args(args_list)
        evaluate_main.main(args)
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dict[str, Any]: Model information
        """
        info = {
            'use_neural_model': self.use_neural_model,
            'device': str(self.device),
            'sample_rate': self.sr,
            'segment_length': self.segment_length
        }
        
        if self.use_neural_model:
            # Add model-specific information
            model_path = os.path.join(self.model_dir, "best_model.pt")
            config_path = os.path.join(self.model_dir, "model_config.json")
            
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    config = json.load(f)
                info['model_config'] = config
            
            if os.path.exists(model_path):
                checkpoint = torch.load(model_path, map_location=self.device)
                info['model_checkpoint'] = {
                    'epoch': checkpoint.get('epoch', 0),
                    'val_loss': checkpoint.get('val_loss', 0.0)
                }
        
        return info

def run_as_script():
    """Run as a standalone script."""
    parser = argparse.ArgumentParser(description="LofiAI: AI-powered lofi music generator")
    
    # Main commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Process command
    process_parser = subparsers.add_parser("process", help="Process audio file")
    process_parser.add_argument("input_path", type=str, help="Path to input audio file")
    process_parser.add_argument("output_path", type=str, help="Path to save output audio file")
    process_parser.add_argument("--use_neural_model", action="store_true", help="Use neural model for generation")
    process_parser.add_argument("--chill_level", type=float, default=None, help="Amount of chill effect (0-100)")
    process_parser.add_argument("--beat_intensity", type=float, default=None, help="Beat strength (0-100)")
    process_parser.add_argument("--vintage_effect", type=float, default=None, help="Amount of vintage/analog warmth (0-100)")
    process_parser.add_argument("--mood", type=str, default=None, help="Mood type ('relaxed', 'focus', 'sleep')")
    
    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze audio file")
    analyze_parser.add_argument("input_path", type=str, help="Path to input audio file")
    analyze_parser.add_argument("--output_path", type=str, default=None, help="Path to save analysis results")
    
    # Train command
    train_parser = subparsers.add_parser("train", help="Train neural model")
    train_parser.add_argument("--data_dir", type=str, default="ai_model/data", help="Directory containing dataset")
    train_parser.add_argument("--output_dir", type=str, default="ai_model/output", help="Directory for output files")
    train_parser.add_argument("--checkpoint_dir", type=str, default="ai_model/models", help="Directory for model checkpoints")
    train_parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    train_parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    train_parser.add_argument("--generate_targets", action="store_true", help="Generate lofi targets using rule-based processing")
    
    # Evaluate command
    evaluate_parser = subparsers.add_parser("evaluate", help="Evaluate neural model")
    evaluate_parser.add_argument("--model_path", type=str, default="ai_model/models/best_model.pt", help="Path to the model checkpoint")
    evaluate_parser.add_argument("--config_path", type=str, default="ai_model/models/model_config.json", help="Path to the model configuration")
    evaluate_parser.add_argument("--input_path", type=str, required=True, help="Path to input file or directory")
    evaluate_parser.add_argument("--output_dir", type=str, default="ai_model/output/evaluation", help="Directory for output files")
    evaluate_parser.add_argument("--mode", type=str, choices=["single", "directory", "benchmark"], default="single", help="Evaluation mode")
    
    # Common parameters
    parser.add_argument("--model_dir", type=str, default="ai_model/models", help="Directory containing model checkpoints")
    parser.add_argument("--device", type=str, default=None, help="Device to run inference on")
    parser.add_argument("--sample_rate", type=int, default=22050, help="Audio sample rate")
    parser.add_argument("--segment_length", type=int, default=22050 * 5, help="Length of audio segments in samples")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Create LofiAI instance
    lofi_ai = LofiAI(
        model_dir=args.model_dir,
        use_neural_model=getattr(args, 'use_neural_model', False),
        device=args.device,
        sr=args.sample_rate,
        segment_length=args.segment_length
    )
    
    # Run command
    if args.command == "process":
        # Check if parameters are provided
        parameters = None
        if args.chill_level is not None or args.beat_intensity is not None or \
           args.vintage_effect is not None or args.mood is not None:
            parameters = {
                'chill_level': args.chill_level if args.chill_level is not None else 50.0,
                'beat_intensity': args.beat_intensity if args.beat_intensity is not None else 50.0,
                'vintage_effect': args.vintage_effect if args.vintage_effect is not None else 50.0,
                'mood': args.mood if args.mood is not None else 'relaxed'
            }
        
        # Process audio
        result = lofi_ai.process_audio(args.input_path, args.output_path, parameters)
        
        # Print result
        print(f"Processed audio saved to {result['output_path']}")
        print(f"Processing time: {result['processing_time']:.2f}s")
        print("Parameters used:")
        for k, v in result['parameters'].items():
            print(f"  {k}: {v}")
    
    elif args.command == "analyze":
        # Analyze audio
        result = lofi_ai.analyze_audio(args.input_path)
        
        # Print result
        print("Analysis results:")
        print("Suggested parameters:")
        for k, v in result['parameters'].items():
            print(f"  {k}: {v}")
        
        # Save results if output path provided
        if args.output_path:
            with open(args.output_path, "w") as f:
                json.dump(result, f, indent=4)
            print(f"Analysis saved to {args.output_path}")
    
    elif args.command == "train":
        # Prepare arguments for training
        train_args = [
            "--data_dir", args.data_dir,
            "--output_dir", args.output_dir,
            "--checkpoint_dir", args.checkpoint_dir,
            "--epochs", str(args.epochs),
            "--batch_size", str(args.batch_size)
        ]
        
        if args.generate_targets:
            train_args.append("--generate_targets")
        
        # Train model
        lofi_ai.train_model(train_args)
    
    elif args.command == "evaluate":
        # Prepare arguments for evaluation
        evaluate_args = [
            "--model_path", args.model_path,
            "--config_path", args.config_path,
            "--input_path", args.input_path,
            "--output_dir", args.output_dir,
            "--mode", args.mode
        ]
        
        # Evaluate model
        lofi_ai.evaluate_model(evaluate_args)
    
    else:
        # Print model information
        info = lofi_ai.get_model_info()
        print("LofiAI Model Information:")
        for k, v in info.items():
            if k not in ['model_config', 'model_checkpoint']:
                print(f"{k}: {v}")
        
        parser.print_help()

if __name__ == "__main__":
    run_as_script()