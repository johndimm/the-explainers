#!/usr/bin/env python3

def main():
    f = open('speaker-exits.txt')
    prev_speaker = None
    
    for line in f:
        line = line.strip()
        if not line:
            continue
            
        # Split by first colon to get offset and content
        parts = line.split(':', 1)
        if len(parts) != 2:
            continue
            
        offset = parts[0]
        content = parts[1]
        
        # Check if this is a speaker line (ends with period)
        if content.endswith('.') and not content.startswith('_'):
            # This is a speaker, remember it (convert to title case)
            prev_speaker = content[:-1].title()  # Remove the period and convert to title case
        # Check if this is a generic exit
        elif '_Exit._' in content:
            if prev_speaker:
                # Create explicit exit for the previous speaker
                print(f"{offset}: [_Exit {prev_speaker}._]")
    
    f.close()

if __name__ == "__main__":
    main()
