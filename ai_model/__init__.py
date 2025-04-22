"""
AI Lofi Music Generator

A custom AI model for transforming regular music into lofi style, built with:
- PyTorch for deep learning
- Librosa for audio processing
- Pedalboard for audio effects
"""

from ai_model.utils.audio_utils import AudioProcessor
from ai_model.inference import LofiGenerator

__version__ = "0.1.0"