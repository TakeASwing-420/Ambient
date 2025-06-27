from pathlib import Path
import cv2
import torch
from transformers import CLIPProcessor, CLIPModel
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

    return {
        "lofifiable_score": round(lofi_score, 3),
        "is_lofifiable": lofifiable
    }

