import torch
from output import Output
from typing import Optional
from model.lofi2lofi_model import Decoder as Lofi2LofiDecoder
from model.constants import HIDDEN_SIZE
from svm_frame_predictor import *

model = load_svm_model("checkpoints")

def decode(model: Lofi2LofiDecoder, video_path: str) -> Optional[str]:
    mu = torch.randn(1, HIDDEN_SIZE)
    test_videos = [video_path]

    lofify = predict_per_frame_with_final(model, test_videos, method='mean')

    try:
        is_lofifiable = lofify["is_lofifiable"]

        if is_lofifiable:
            hash, (pred_chords, pred_notes, tempo, pred_key, pred_mode, valence, energy) = model.decode(mu)
            output = Output(hash, pred_chords, pred_notes, tempo, pred_key, pred_mode, valence, energy)
            json = output.to_json()
            return json
        else:
            return None
    except Exception as e:
        print(f"Error occurred: {e}")
        return 'Lofifiable_tag not found.'
