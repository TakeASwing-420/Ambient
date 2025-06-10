import json
import random
import os

# Import constants needed for Output class
try:
    from model.constants import CHORD_END_TOKEN, NOTES_PER_CHORD
except ImportError:
    # Fallback constants if model is not available
    CHORD_END_TOKEN = 0
    NOTES_PER_CHORD = 4

# Simplified Output class that doesn't depend on external libraries
class SimpleOutput:
    def __init__(self, title, key, mode, bpm, energy, valence, chords, melodies, swing):
        self.title = title
        self.key = key
        self.mode = mode
        self.bpm = bpm
        self.energy = energy
        self.valence = valence
        self.chords = chords
        self.melodies = melodies
        self.swing = swing
    
    def to_json(self):
        import json
        data = {
            'title': self.title,
            'key': self.key,
            'mode': self.mode,
            'bpm': self.bpm,
            'energy': self.energy,
            'valence': self.valence,
            'chords': self.chords,
            'melodies': self.melodies,
            'swing': self.swing
        }
        return json.dumps(data)

class MockTensor:
    def __init__(self, data):
        self.data = data
    
    def argmax(self, dim=None):
        if dim is None:
            if isinstance(self.data, list) and len(self.data) > 0:
                return MockTensor([max(range(len(self.data)), key=lambda i: self.data[i])])
            return MockTensor([0])
        
        # Handle 3D tensor case for chord progressions
        if dim == 2 and isinstance(self.data, list) and len(self.data) > 0:
            result = []
            for batch in self.data:
                batch_result = []
                for seq in batch:
                    if isinstance(seq, list) and len(seq) > 0:
                        batch_result.append(max(range(len(seq)), key=lambda i: seq[i]))
                    else:
                        batch_result.append(0)
                result.append(batch_result)
            return MockTensor(result)
        
        return MockTensor([[0]])
    
    def __getitem__(self, index):
        if isinstance(self.data, list) and len(self.data) > index:
            return MockTensor(self.data[index])
        return MockTensor([0])
    
    def tolist(self):
        return self.data
    
    def cpu(self):
        return self
    
    def numpy(self):
        return self.data
    
    def item(self):
        if isinstance(self.data, list) and len(self.data) > 0:
            return self.data[0]
        return self.data if not isinstance(self.data, list) else 0
    
    def reshape(self, *shape):
        if len(shape) == 2:
            rows, cols = shape
            flat = self.data if isinstance(self.data, list) else [self.data]
            result = []
            for i in range(0, len(flat), cols):
                row = flat[i:i+cols]
                # Pad row if needed
                while len(row) < cols:
                    row.append(0)
                result.append(row)
            return MockTensor(result)
        return self

def predict_music_features(video_path):
    """
    Fallback music feature prediction that generates realistic lofi parameters
    based on video filename and basic heuristics.
    """
    try:
        # Extract basic info from video filename
        filename = os.path.basename(video_path).lower()
        
        # Seed random generator with filename for consistency
        seed = sum(ord(c) for c in filename)
        random.seed(seed)
        
        # Generate music parameters based on filename characteristics
        energy = 0.2 + (random.random() * 0.6)  # 0.2-0.8 range
        valence = 0.3 + (random.random() * 0.5)  # 0.3-0.8 range
        
        # Determine tempo category based on energy
        if energy < 0.4:
            tempo = "slow"
            bpm = 70 + random.randint(0, 10)
        elif energy < 0.7:
            tempo = "medium" 
            bpm = 80 + random.randint(0, 15)
        else:
            tempo = "fast"
            bpm = 90 + random.randint(0, 10)
        
        # Generate key (1-12 for C to B)
        key = random.randint(1, 12)
        
        # Generate mode (1=major, 2=minor, favor minor for lofi)
        mode = 2 if random.random() < 0.7 else 1
        
        # Generate chord progression (common lofi progressions)
        chord_progressions = [
            [1, 4, 5, 1],      # I-IV-V-I
            [6, 4, 1, 5],      # vi-IV-I-V
            [1, 6, 4, 5],      # I-vi-IV-V
            [2, 5, 1, 6],      # ii-V-I-vi
            [1, 3, 6, 4],      # I-iii-vi-IV
        ]
        chords = random.choice(chord_progressions)
        
        # Generate simple melody pattern
        melody_notes = []
        for _ in range(len(chords) * 4):  # 4 notes per chord
            melody_notes.append(random.randint(1, 8))  # scale degrees
        
        # Create mock tensors for Output class
        pred_chords = MockTensor([[[1 if i == (c-1) else 0 for i in range(8)] for c in chords + [0]]])
        
        # Create proper pred_notes structure that matches what Output expects
        # Output expects pred_notes.argmax(dim=2)[0].cpu().numpy()
        notes_tensor_data = []
        for note in melody_notes:
            # Create one-hot encoding for each note
            one_hot = [1 if i == (note-1) else 0 for i in range(8)]
            notes_tensor_data.append(one_hot)
        pred_notes = MockTensor([[notes_tensor_data]])
        pred_tempo = tempo
        pred_key = MockTensor([key - 1])  # 0-indexed for argmax
        pred_mode = MockTensor([mode - 1])  # 0-indexed for argmax
        pred_energy = MockTensor([energy])
        pred_valence = MockTensor([valence])
        pred_swing = MockTensor([0.2 + random.random() * 0.4])  # 0.2-0.6 swing
        
        # Create output object using simplified version
        title = f"LoFi Track - {os.path.splitext(os.path.basename(video_path))[0]}"
        
        # Convert melodies to the expected format
        melody_patterns = []
        for i in range(0, len(melody_notes), NOTES_PER_CHORD):
            pattern = melody_notes[i:i+NOTES_PER_CHORD]
            while len(pattern) < NOTES_PER_CHORD:
                pattern.append(1)  # pad with root note
            melody_patterns.append(pattern)
        
        output = SimpleOutput(
            title=title,
            key=key,
            mode=mode,
            bpm=bpm,
            energy=energy,
            valence=valence,
            chords=chords,
            melodies=melody_patterns,
            swing=0.2 + random.random() * 0.4
        )
        
        return output
        
    except Exception as e:
        print(f"Error in fallback processor: {e}")
        return None

if __name__ == "__main__":
    # Test the fallback processor
    test_video = "test_video.mp4"
    result = predict_music_features(test_video)
    if result:
        print("Generated parameters:")
        print(f"Key: {result.key}")
        print(f"Mode: {result.mode}")
        print(f"BPM: {result.bpm}")
        print(f"Energy: {result.energy}")
        print(f"Valence: {result.valence}")
        print(f"Chords: {result.chords}")
        print(f"JSON: {result.to_json()}")