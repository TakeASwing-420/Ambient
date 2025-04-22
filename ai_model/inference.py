import os
import torch
import numpy as np
import argparse
import json
import librosa
import soundfile as sf
from typing import Dict, Tuple, List, Optional, Any, Union
import time

from ai_model.models.lofi_model import LofiNet
from ai_model.utils.audio_utils import AudioProcessor
from ai_model.evaluate import load_model, apply_model_to_audio

class LofiGenerator:
    """
    Class for generating lofi music from audio files.
    """
    def __init__(
        self, 
        model_path: str, 
        config_path: Optional[str] = None, 
        device: Optional[str] = None, 
        sr: int = 22050, 
        segment_length: int = 22050 * 5, 
        overlap: float = 0.1
    ):
        """
        Initialize the lofi generator.
        
        Args:
            model_path (str): Path to the model checkpoint
            config_path (Optional[str]): Path to the model configuration
            device (Optional[str]): Device to run inference on ('cuda' or 'cpu')
            sr (int): Sample rate
            segment_length (int): Length of audio segments in samples
            overlap (float): Overlap between segments (0-1)
        """
        # Set device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Initialize audio processor
        self.audio_processor = AudioProcessor(sr=sr)
        
        # Set parameters
        self.sr = sr
        self.segment_length = segment_length
        self.overlap = overlap
        
        # Load model
        self.model = load_model(model_path, config_path, self.device)
        print(f"Model loaded on {self.device}")
    
    def generate(
        self, 
        input_path: str, 
        output_path: str, 
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate lofi version of an audio file.
        
        Args:
            input_path (str): Path to input audio file
            output_path (str): Path to save output audio file
            parameters (Optional[Dict[str, Any]]): Parameters for lofi generation
            
        Returns:
            str: Path to generated lofi file
        """
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Load audio
            y, sr = self.audio_processor.load_audio(input_path)
            
            # Extract features
            features = self.audio_processor.extract_features(y, sr)
            
            # Apply AI model if available
            if parameters is None:
                # Use model's parameter prediction based on audio features
                if self.model.param_predictor is not None:
                    # Get feature values
                    feature_values = [v for k, v in features.items() if k != "file_path"]
                    feature_tensor = torch.FloatTensor(feature_values).unsqueeze(0).to(self.device)
                    
                    # Predict parameters
                    with torch.no_grad():
                        param_outputs = self.model.param_predictor(feature_tensor)
                    
                    # Convert to parameters dict
                    parameters = {
                        'chill_level': param_outputs['chill_level'].item(),
                        'beat_intensity': param_outputs['beat_intensity'].item(),
                        'vintage_effect': param_outputs['vintage_effect'].item(),
                        'mood': 'relaxed'  # Default mood
                    }
                    
                    # Determine mood from mood logits
                    if 'mood_logits' in param_outputs:
                        mood_idx = torch.argmax(param_outputs['mood_logits']).item()
                        moods = ['relaxed', 'focus', 'sleep']
                        if mood_idx < len(moods):
                            parameters['mood'] = moods[mood_idx]
                else:
                    # Use defaults or features-based analysis
                    parameters = self.audio_processor.analyze_audio_mood(features)
            
            # Print parameters
            print("Using parameters:", parameters)
            
            # Option 1: Use neural network model (if fully trained)
            if hasattr(self, 'use_nn_model') and self.use_nn_model:
                # Apply model
                processed_audio, sr = apply_model_to_audio(
                    self.model, input_path, output_path, self.device, 
                    sr=self.sr, segment_length=self.segment_length, 
                    overlap=self.overlap, features=feature_tensor
                )
            else:
                # Option 2: Use rule-based processing with parameters
                processed_audio = self.audio_processor.apply_lofi_effects(
                    y, sr,
                    chill_level=parameters['chill_level'],
                    beat_intensity=parameters['beat_intensity'],
                    vintage_effect=parameters['vintage_effect'],
                    mood=parameters['mood']
                )
                
                # Save output
                sf.write(output_path, processed_audio, sr)
            
            return output_path
        
        except Exception as e:
            print(f"Error generating lofi: {e}")
            raise

    def generate_from_parameters(
        self, 
        input_path: str, 
        output_path: str, 
        chill_level: float = 50.0, 
        beat_intensity: float = 50.0, 
        vintage_effect: float = 50.0, 
        mood: str = 'relaxed'
    ) -> str:
        """
        Generate lofi version with specific parameters.
        
        Args:
            input_path (str): Path to input audio file
            output_path (str): Path to save output audio file
            chill_level (float): Amount of chill effect (0-100)
            beat_intensity (float): Beat strength (0-100)
            vintage_effect (float): Amount of vintage/analog warmth (0-100)
            mood (str): Mood type ('relaxed', 'focus', 'sleep')
            
        Returns:
            str: Path to generated lofi file
        """
        parameters = {
            'chill_level': chill_level,
            'beat_intensity': beat_intensity,
            'vintage_effect': vintage_effect,
            'mood': mood
        }
        
        return self.generate(input_path, output_path, parameters)
    
    def analyze_audio(self, input_path: str) -> Dict[str, Any]:
        """
        Analyze audio file and suggest parameters.
        
        Args:
            input_path (str): Path to input audio file
            
        Returns:
            Dict[str, Any]: Suggested parameters and audio features
        """
        # Load audio
        y, sr = self.audio_processor.load_audio(input_path)
        
        # Extract features
        features = self.audio_processor.extract_features(y, sr)
        
        # Analyze for parameter suggestions
        parameters = self.audio_processor.analyze_audio_mood(features)
        
        return {
            'parameters': parameters,
            'features': features
        }

def main(args):
    """
    Main function for generating lofi music.
    
    Args:
        args: Command line arguments
    """
    # Create generator
    generator = LofiGenerator(
        model_path=args.model_path,
        config_path=args.config_path,
        device=args.device,
        sr=args.sample_rate,
        segment_length=args.segment_length,
        overlap=args.overlap
    )
    
    # Check mode
    if args.mode == "analyze":
        # Analyze audio
        analysis = generator.analyze_audio(args.input_path)
        
        # Print analysis
        print("\nAudio Analysis:")
        print("--------------")
        print(f"Suggested Parameters:")
        for k, v in analysis['parameters'].items():
            print(f"  {k}: {v}")
        
        print("\nAudio Features:")
        for k, v in analysis['features'].items():
            if k != "file_path":
                print(f"  {k}: {v}")
        
        # Save analysis as JSON
        if args.output_path:
            with open(args.output_path, "w") as f:
                json.dump(analysis, f, indent=4)
            print(f"\nAnalysis saved to {args.output_path}")
    
    elif args.mode == "generate":
        # Generate lofi
        start_time = time.time()
        
        if args.parameters_file:
            # Load parameters from file
            with open(args.parameters_file, "r") as f:
                parameters = json.load(f)
            
            # Generate with custom parameters
            output_path = generator.generate(args.input_path, args.output_path, parameters)
        elif args.use_custom_params:
            # Generate with command line parameters
            output_path = generator.generate_from_parameters(
                args.input_path, args.output_path,
                chill_level=args.chill_level,
                beat_intensity=args.beat_intensity,
                vintage_effect=args.vintage_effect,
                mood=args.mood
            )
        else:
            # Generate with automatic parameters
            output_path = generator.generate(args.input_path, args.output_path)
        
        processing_time = time.time() - start_time
        print(f"Lofi generation complete in {processing_time:.2f}s")
        print(f"Output saved to {output_path}")

def parse_args():
    """
    Parse command line arguments.
    
    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Generate lofi music")
    
    # Mode
    parser.add_argument("--mode", type=str, choices=["analyze", "generate"], default="generate", 
                        help="Mode: analyze audio or generate lofi")
    
    # Model parameters
    parser.add_argument("--model_path", type=str, required=True, 
                        help="Path to the model checkpoint")
    parser.add_argument("--config_path", type=str, default=None, 
                        help="Path to the model configuration")
    
    # Input/output paths
    parser.add_argument("--input_path", type=str, required=True, 
                        help="Path to input audio file")
    parser.add_argument("--output_path", type=str, default=None, 
                        help="Path to save output file")
    
    # Parameters
    parser.add_argument("--parameters_file", type=str, default=None, 
                        help="Path to JSON file with parameters")
    parser.add_argument("--use_custom_params", action="store_true", 
                        help="Use command line parameters")
    parser.add_argument("--chill_level", type=float, default=50.0, 
                        help="Amount of chill effect (0-100)")
    parser.add_argument("--beat_intensity", type=float, default=50.0, 
                        help="Beat strength (0-100)")
    parser.add_argument("--vintage_effect", type=float, default=50.0, 
                        help="Amount of vintage/analog warmth (0-100)")
    parser.add_argument("--mood", type=str, choices=["relaxed", "focus", "sleep"], default="relaxed", 
                        help="Mood type")
    
    # Audio processing parameters
    parser.add_argument("--sample_rate", type=int, default=22050, 
                        help="Audio sample rate")
    parser.add_argument("--segment_length", type=int, default=22050 * 5, 
                        help="Audio segment length in samples")
    parser.add_argument("--overlap", type=float, default=0.1, 
                        help="Overlap between segments (0-1)")
    
    # Misc parameters
    parser.add_argument("--device", type=str, default=None, 
                        help="Device for inference (cuda or cpu)")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # Set default output path if not specified
    if args.output_path is None:
        if args.mode == "generate":
            basename = os.path.basename(args.input_path)
            name, ext = os.path.splitext(basename)
            args.output_path = f"lofi_{name}{ext}"
        elif args.mode == "analyze":
            basename = os.path.basename(args.input_path)
            name, _ = os.path.splitext(basename)
            args.output_path = f"{name}_analysis.json"
    
    main(args)