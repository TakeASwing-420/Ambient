from pathlib import Path
import cv2
import torch
import numpy as np
from transformers import CLIPProcessor, CLIPModel
from sklearn.metrics.pairwise import cosine_similarity
from model.Lofifiable_model import LofiClassifier
import model
import os

# Load CLIP
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
classifier = LofiClassifier(input_dim=512).to(device)  # CLIP image embeddings are 512-dim
checkpoint_path = Path(__file__).parent / "checkpoints" / "lofi_nn_classifier.pth"
checkpoint = torch.load(checkpoint_path, map_location=device)  # Update path
classifier.load_state_dict(checkpoint)
classifier.eval()

# Define feature label sets
valence_labels = ["sad", "neutral", "happy"]
tempo_labels = ["slow tempo", "medium tempo", "fast tempo"]
energy_labels = ["low energy", "moderate energy", "high energy"]
swing_labels = ["mechanical rhythm", "slightly swung rhythm", "very swung rhythm"]

# Frame extraction with checks and logging
def extract_frames(video_path, num_frames=10):
    if not os.path.isfile(video_path):
        print(f"[ERROR] File not found: {video_path}")
        return []

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open video file: {video_path}")
        return []

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count == 0:
        print(f"[ERROR] Video has zero frames: {video_path}")
        return []

    interval = max(frame_count // num_frames, 1)
    frames = []

    for i in range(num_frames):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * interval)
        ret, frame = cap.read()
        if not ret:
            print(f"[WARNING] Could not read frame {i * interval}")
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(rgb)

    cap.release()
    print(f"[INFO] Extracted {len(frames)} frames from '{video_path}'")
    return frames

# Helper: compute similarities between image embedding and text prompts
def rank_labels(image_embedding, text_labels):
    inputs = processor(text=text_labels, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
    similarities = cosine_similarity(image_embedding.cpu(), text_features.cpu())[0]
    return similarities

# Main predictor with safety checks
# Main predictor with safety checks
def predict_music_features(video_path):
    frames = extract_frames(video_path)
    if len(frames) == 0:
        raise ValueError("❌ No frames extracted from video. Please check the file path and format.")

    inputs = processor(images=frames, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)

    image_embedding = image_features.mean(dim=0, keepdim=True)

    # --- Predict Lofi-fiability using the trained classifier ---
    with torch.no_grad():
        lofi_score = classifier(image_embedding).item()  # value between 0–1
    lofifiable:bool = lofi_score > 0.5  # threshold

    # Compute similarity-based features
    valence_scores = rank_labels(image_embedding, valence_labels)
    tempo_scores = rank_labels(image_embedding, tempo_labels)
    energy_scores = rank_labels(image_embedding, energy_labels)
    swing_scores = rank_labels(image_embedding, swing_labels)

    # Normalize scores to [0, 1]
    valence = np.dot(valence_scores, [0.0, 0.5, 1.0]) / valence_scores.sum()
    tempo_idx = int(np.argmax(tempo_scores))
    energy = np.dot(energy_scores, [1.0, 0.5, 0.0]) / energy_scores.sum()
    swing = np.dot(swing_scores, [0, 0.5, 1.0]) / swing_scores.sum()

    tempo_str = tempo_labels[tempo_idx].replace(" tempo", "")

    return {
        "valence": round(valence, 3),
        "tempo": tempo_str,
        "energy": round(energy, 3),
        "swing": round(swing, 3),
        "lofifiable_score": round(lofi_score, 3),
        "is_lofifiable": lofifiable
    }

