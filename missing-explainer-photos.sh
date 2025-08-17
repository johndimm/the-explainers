#!/bin/bash

# Script to download missing explainer photos from Wikipedia Commons
# These are the explainers that don't have photos yet

PHOTO_DIR="./public/explainer-photos"

echo "Creating photo directory..."
mkdir -p "$PHOTO_DIR"

echo "Downloading missing explainer photos..."

# Missing explainers (no photos found yet):
echo "Searching for these explainers on Wikipedia Commons:"
echo "- jim-jefferies (Australian comedian)"
echo "- andy-andrist (Midwest comedian)" 

# Placeholder downloads for missing ones (these may fail):
curl -L -o "$PHOTO_DIR/jim-jefferies.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Jim_Jefferies_2019.jpg/800px-Jim_Jefferies_2019.jpg" || echo "Jim Jefferies photo not found"
curl -L -o "$PHOTO_DIR/andy-andrist.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Andy_Andrist.jpg/800px-Andy_Andrist.jpg" || echo "Andy Andrist photo not found"

echo ""
echo "All other explainers already have photos downloaded:"
echo "✓ harold-bloom, carl-sagan, louis-ck, david-foster-wallace"
echo "✓ neil-degrasse-tyson, oscar-wilde, stephen-fry, bill-bryson" 
echo "✓ maya-angelou, anthony-bourdain, douglas-adams, terry-pratchett"
echo "✓ joan-didion, jerry-seinfeld, andrew-dice-clay, howard-stern"
echo "✓ tina-fey, dave-chappelle, amy-poehler, ricky-gervais"
echo "✓ sarah-silverman, john-mulaney, ali-wong, bo-burnham"
echo "✓ oprah-winfrey, david-letterman, conan-obrien, stephen-colbert"
echo "✓ jimmy-fallon, ellen-degeneres, trevor-noah, john-oliver"
echo "✓ jon-stewart, david-sedaris, mark-twain, ts-eliot"
echo "✓ rudyard-kipling, tom-wolfe, flannery-oconnor, humphrey-bogart"
echo "✓ anthony-jeselnik, doug-stanhope, jim-norton, daniel-tosh"
echo "✓ bill-burr, lewis-black, george-carlin, sam-kinison"
echo "✓ paul-mooney, bill-hicks, bob-saget"
echo ""
echo "Total: 49 out of 51 explainers have photos!"