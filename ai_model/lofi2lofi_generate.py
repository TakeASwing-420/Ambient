import torch
from output import Output
from typing import Optional
from model.lofi2lofi_model import Decoder as Lofi2LofiDecoder
from model.constants import HIDDEN_SIZE
from svm_frame_predictor import *

# Load SVM model globally
svm_model = load_svm_model("checkpoints")

def decode(decoder: Lofi2LofiDecoder, video_path: str) -> Optional[str]:
    mu = torch.randn(1, HIDDEN_SIZE)
    test_videos = [video_path]

    # Use SVM model for prediction
    lofify_results = predict_per_frame_with_final(svm_model, test_videos, method='mean')
    lofify = lofify_results.get(video_path, {})

    try:
        is_lofifiable = lofify.get("is_lofifiable", False)

        if is_lofifiable:
            hash, (pred_chords, pred_notes, tempo, pred_key, pred_mode, valence, energy) = decoder.decode(mu)
            output = Output(hash, pred_chords, pred_notes, tempo, pred_key, pred_mode, valence, energy)
            json = output.to_json()
            return json
        else:
            return None
    except Exception as e:
        print(f"Error occurred: {e}")
        return 'Lofifiable_tag not found.'
