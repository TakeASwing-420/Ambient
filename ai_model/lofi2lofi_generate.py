import torch
from output import Output
from videoprocessor import predict_music_features
from typing import Optional
from model.lofi2lofi_model import Decoder as Lofi2LofiDecoder
from model.constants import HIDDEN_SIZE

checkers = ["chill and lofi", "uplifting and hopeful", "bright and happy", "calm and ambient", "mysterious and cinematic", "fast-paced and energetic", "adventurous and exploratory", "romantic and emotional", "peaceful and serene", "melancholic and reflective", "energetic and upbeat", "epic and climatic"]

def decode(model: Lofi2LofiDecoder, video_path: str) -> Optional[str]:
    mu = torch.randn(1, HIDDEN_SIZE)

    lofify = predict_music_features(video_path)
    is_lofifiable = any(lofify["mood_tag"]==x for x in checkers)

    if is_lofifiable:
        hash, (pred_chords, pred_notes, _, pred_key, pred_mode, _, _) = model.decode(mu)
        output = Output(hash, pred_chords, pred_notes, lofify["tempo"], pred_key, pred_mode, lofify["valence"], lofify["energy"],lofify["swing"])
        json = output.to_json()
        return json
    elif lofify.get("mood_tag"):
        print(lofify)
        return None
    else:
        print(lofify)
        return "mood_tag not present"

