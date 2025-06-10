import argparse
import json
import tempfile
import os
import torch

from model.lofi2lofi_model import Decoder as Lofi2LofiDecoder
from lofi2lofi_generate import decode

def process_video(video_path, output_path):
    """Process video and generate lofi parameters"""
    device = "cpu"
    
    # Load model
    checkpoint = os.path.join(os.path.dirname(__file__), "checkpoints/lofi2lofi_decoder.pth")
    model = Lofi2LofiDecoder(device=device)
    model.load_state_dict(torch.load(checkpoint, map_location=device))
    model.to(device)
    model.eval()
    
    try:
        result = decode(model, video_path)
        if result is None:
            return {"error": "Input video is not lofifiable."}
        elif result == "mood_tag not present":
            return {"error": "Mood_tag not found."}
        
        # Write result to output file
        with open(output_path, 'w') as f:
            json.dump({"success": True, "data": result}, f)
        
        return {"success": True, "data": result}
    except Exception as e:
        error_result = {"error": f"Server error: {str(e)}"}
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
