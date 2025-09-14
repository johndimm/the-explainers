#!/bin/bash

# Scan 2: Extract speaker names and generic exits
SPEAKERS='^[A-Z]{3,}\.\s*$'
EXITS='_Exit\._'

COMBO="$SPEAKERS|$EXITS"
grep -E -b "$COMBO" twelfth-night.txt > speaker-exits.txt

# Process generic exits to create explicit exits
python3 single-exit.py > single-exit.txt


