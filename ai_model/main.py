import argparse
import json
import torch
from model.lofi2lofi_model import Decoder as Lofi2LofiDecoder
from lofi2lofi_generate import decode

device = "cpu"
# Load model once
checkpoint = "f:/Lofify/ai_model/checkpoints/lofi2lofi_decoder.pth"
model = Lofi2LofiDecoder(device=device)
model.load_state_dict(torch.load(checkpoint, map_location=device))
model.to(device)
model.eval()

def process_video(video_path, output_path):
    """Process video and generate lofi parameters"""
    try:
        result = decode(model, video_path)
        
        if result is None:
            error_result = {"success": False, "error": "Failed to analyze video"}
            with open(output_path, 'w') as f:
                json.dump(error_result, f)
            return error_result
        
        # Extract values without defaults - return failure if any are missing
        try:
            title = getattr(result, 'title')
            key = int(getattr(result, 'key'))
            mode = int(getattr(result, 'mode'))
            bpm = int(getattr(result, 'bpm'))
            energy = float(getattr(result, 'energy'))
            valence = float(getattr(result, 'valence'))
            swing = float(getattr(result, 'swing'))
            chords = getattr(result, 'chords')
            melodies = getattr(result, 'melodies')
        except AttributeError as e:
            error_result = {"success": False, "error": f"Missing required attribute: {str(e)}"}
            with open(output_path, 'w') as f:
                json.dump(error_result, f)
            return error_result
        
        # Convert result to the expected format
        success_result = {
            "success": True,
            "data": {
                "title": title,
                "key": key,
                "mode": mode,
                "bpm": bpm,
                "energy": energy,
                "valence": valence,
                "swing": swing,
                "chords": chords,
                "melodies": melodies
            }
        }
        
        # Write result to output file
        with open(output_path, 'w') as f:
            json.dump(success_result, f)
        
        return success_result
        
    except Exception as e:
        error_result = {"success": False, "error": f"Processing error: {str(e)}"}
        with open(output_path, 'w') as f:
            json.dump(error_result, f)
        return error_result

def main():
    parser = argparse.ArgumentParser(description='Process video to generate lofi music parameters')
    parser.add_argument('--video-path', required=True, help='Path to input video file')
    parser.add_argument('--output-path', required=True, help='Path to output JSON file')
    
    args = parser.parse_args()
    
    result = process_video(args.video_path, args.output_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
