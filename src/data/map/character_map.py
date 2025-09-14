#!/usr/bin/env python3
import re

def main():
    f = open("structure-exits.txt")
    act = None
    scene = None
    characters = []
    
    def add_characters(char_line):
        """Add characters from an Enter line"""
        if "Enter" not in char_line:
            return
            
        # Extract the character list after "Enter"
        charstring = char_line.split("Enter", 1)[1]
        # Split by common delimiters and clean up
        chars = re.split(r",|with|and", charstring)
        for char in chars:
            char = char.strip().rstrip('.')
            if char and char not in characters:
                characters.append(char)
    
    def remove_characters(char_line):
        """Remove characters from an Exit line"""
        if "Exit" not in char_line:
            return
            
        # Extract character name from [_Exit Character._] format
        match = re.search(r'\[_Exit\s+([^._]+)\._\]', char_line)
        if match:
            char_name = match.group(1).strip()
            # Find and remove the character (case-insensitive)
            for i, char in enumerate(characters):
                if char.lower() == char_name.lower():
                    characters.pop(i)
                    break
    
    for line in f:
        line = line.strip()
        if not line:
            continue
            
        # Split by first colon to get offset and content
        parts = line.split(":", 1)
        if len(parts) != 2:
            continue
            
        offset = parts[0]
        body = parts[1]
        
        if "ACT" in body:
            act = body
        elif "SCENE" in body:
            scene = body.split(".")[0]
            characters = []  # Reset characters at start of new scene
        elif "Enter" in body:
            add_characters(body)
            print(f"{offset} {act} {scene} {characters}")
        elif "Exit" in body:
            remove_characters(body)
            print(f"{offset} {act} {scene} {characters}")
        elif "Exeunt" in body:
            characters = []  # All characters exit
            print(f"{offset} {act} {scene} {characters}")

    f.close()

if __name__ == "__main__":
    main()