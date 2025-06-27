import cv2, os, joblib
import torch
import numpy as np
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
import clip

device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, preprocess = clip.load("ViT-B/32", device=device)


FRAME_INTERVAL = 5
PIXEL_SIM_THRESHOLD = 0.95
EMBED_SIM_THRESHOLD = 0.97

def get_frame_embeddings(video_path, frame_interval=FRAME_INTERVAL, pixel_thresh=PIXEL_SIM_THRESHOLD, embed_thresh=EMBED_SIM_THRESHOLD):
    try:
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        embeddings = []
        last_frame_vector = None

        for idx in range(0, frame_count, frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            success, frame = cap.read()
            if not success:
                continue

            small = cv2.resize(frame, (64, 64)).flatten().astype(np.float32)
            small = small / np.linalg.norm(small)

            if last_frame_vector is not None:
                sim = cosine_similarity([small], [last_frame_vector])[0][0]
                if sim > pixel_thresh:
                    continue

            last_frame_vector = small

            image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            image_input = preprocess(image).unsqueeze(0).to(device)

            with torch.no_grad():
                emb = clip_model.encode_image(image_input).float().squeeze(0).cpu()

            if embeddings:
                sims = cosine_similarity([emb.numpy()], [e.numpy() for e in embeddings])
                if sims.max() > embed_thresh:
                    continue

            embeddings.append(emb)

        cap.release()
        return torch.stack(embeddings) if embeddings else None

    except Exception as e:
        print(f"❌ Error processing {video_path}: {e}")
        return None

def load_svm_model(model_dir):
    """Load a trained SVM model from a directory."""
    model_path = os.path.join(model_dir, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"No model found at {model_path}")
    
    model = joblib.load(model_path)
    return model

def predict_per_frame_with_final(model, video_paths, method='mean'):
    """
    Predict per-frame and give final video-level prediction + confidence.
    
    method: 'mean' or 'majority'
    Returns: dict { video_path: {frame_probs, final_label, confidence} }
    """
    results = {}

    for path in video_paths:
        print(f"🎞️ Processing: {path}")
        embeddings = get_frame_embeddings(path)

        if embeddings is None:
            print(f"⚠️ Skipped: {path} (no meaningful frames)")
            continue

        emb_np = embeddings.numpy()  # shape: (T, 512)
        probs = model.predict_proba(emb_np)[:, 1]  # P(lofiable) for each frame

        if method == 'mean':
            final_prob = probs.mean()
            final_label = int(final_prob >= 0.5)
            confidence = abs(final_prob - 0.5) * 2  # [0,1] how far from decision boundary
        elif method == 'majority':
            votes = (probs >= 0.5).astype(int)
            final_label = int(votes.sum() >= (len(votes) / 2))
            confidence = abs(votes.mean() - 0.5) * 2  # [0,1]
            final_prob = probs.mean()
        else:
            raise ValueError("method must be 'mean' or 'majority'")

        results[path] = {
            "frame_probs": probs.tolist(),
            "is_lofifiable": final_label,
            "confidence": round(confidence, 4),
            "avg_prob": round(final_prob, 4)
        }

    return results

if __name__ == "__main__":
    model = load_svm_model("models_1/svm")
    test_videos = ["samples/vid1.mp4", "samples/vid2.mp4"]

    results = predict_per_frame_with_final(model, test_videos, method='mean')

    for vid, info in results.items():
        print(f"\n🎬 {vid}")
        print(f"→ Final Prediction: {'Lofiable' if info['is_lofifiable'] else 'Not Lofiable'}")
        print(f"→ Confidence: {info['confidence']:.2f}")
        print(f"→ Average Probability: {info['avg_prob']:.4f}")
        print(f"→ Frames Analyzed: {len(info['frame_probs'])}")
