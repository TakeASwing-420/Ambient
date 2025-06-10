import argparse
import json
import os
import sys
from videoprocessor import predict_music_features

def process_video(video_path, output_path):
    """Process video and generate lofi parameters"""
    try:
        # Use the videoprocessor to analyze the video
        result = predict_music_features(video_path)
        
        if result is None:
            error_result = {"success": False, "error": "Failed to analyze video"}
            with open(output_path, 'w') as f:
                json.dump(error_result, f)
            return error_result
        
        # Convert result to the expected format
        success_result = {
            "success": True,
            "data": {
                "title": getattr(result, 'title', 'Generated LoFi Track'),
                "key": int(getattr(result, 'pred_key', 1)),
                "mode": int(getattr(result, 'pred_mode', 0)), 
                "bpm": int(getattr(result, 'pred_tempo', 85)),
                "energy": float(getattr(result, 'pred_energy', 0.5)),
                "valence": float(getattr(result, 'pred_valence', 0.6)),
                "swing": float(getattr(result, 'pred_swing', 0.3)),
                "chords": getattr(result, 'pred_chords', [1, 4, 5, 1]),
                "melodies": getattr(result, 'pred_notes', [[60, 62, 64, 67]])
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
