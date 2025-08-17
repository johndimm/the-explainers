#!/bin/bash

# Script to fix corrupted explainer photos from Wikipedia Commons
# Usage: ./fix-corrupted-photos.sh

PHOTO_DIR="./public/explainer-photos"

echo "Fixing corrupted explainer photos..."

# Remove corrupted files first
rm -f "$PHOTO_DIR/andy-andrist.jpg"
rm -f "$PHOTO_DIR/anthony-bourdain.jpg"
rm -f "$PHOTO_DIR/bill-bryson.jpg"
rm -f "$PHOTO_DIR/bill-hicks.jpg"
rm -f "$PHOTO_DIR/george-carlin.jpg"
rm -f "$PHOTO_DIR/jim-jefferies.jpg"
rm -f "$PHOTO_DIR/joan-didion.jpg"
rm -f "$PHOTO_DIR/maya-angelou.jpg"
rm -f "$PHOTO_DIR/rudyard-kipling.jpg"
rm -f "$PHOTO_DIR/stephen-fry.jpg"
rm -f "$PHOTO_DIR/terry-pratchett.jpg"
rm -f "$PHOTO_DIR/tom-wolfe.jpg"
rm -f "$PHOTO_DIR/ts-eliot.jpg"

# Download corrected versions
curl -L -o "$PHOTO_DIR/andy-andrist.jpg" "https://upload.wikimedia.org/wikipedia/commons/1/1a/Andy_Andrist.jpg"
curl -L -o "$PHOTO_DIR/anthony-bourdain.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/9a/Anthony_Bourdain_2014.jpg"
curl -L -o "$PHOTO_DIR/bill-bryson.jpg" "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bill_Bryson.jpg"
curl -L -o "$PHOTO_DIR/bill-hicks.jpg" "https://upload.wikimedia.org/wikipedia/commons/0/0d/Bill_Hicks_at_the_Laff_Stop_in_Austin%2C_Texas%2C_1991.jpg"
curl -L -o "$PHOTO_DIR/george-carlin.jpg" "https://upload.wikimedia.org/wikipedia/commons/b/ba/George_Carlin_1969.JPG"
curl -L -o "$PHOTO_DIR/joan-didion.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/7b/Joan_Didion_at_the_Brooklyn_Book_Festival.jpg"
curl -L -o "$PHOTO_DIR/maya-angelou.jpg" "https://upload.wikimedia.org/wikipedia/commons/4/4a/Portrait_photograph_of_Maya_Angelou_with_a_copy_of_I_Know_Why_the_Caged_Bird_Sings_in_Los_Angeles%2C_November_3%2C_1971.jpg"
curl -L -o "$PHOTO_DIR/rudyard-kipling.jpg" "https://upload.wikimedia.org/wikipedia/commons/8/85/Photo_of_Rudyard_Kipling.jpg"
curl -L -o "$PHOTO_DIR/stephen-fry.jpg" "https://upload.wikimedia.org/wikipedia/commons/8/8c/Stephen_Fry_%282016%29.jpg"
curl -L -o "$PHOTO_DIR/terry-pratchett.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/74/Sir_Terry_Pratchett.JPG"
curl -L -o "$PHOTO_DIR/tom-wolfe.jpg" "https://upload.wikimedia.org/wikipedia/commons/b/b6/TomWolfe02.jpg"
curl -L -o "$PHOTO_DIR/ts-eliot.jpg" "https://upload.wikimedia.org/wikipedia/commons/8/87/T.S._Eliot%2C_1923.JPG"

# Note: jim-jefferies photo not available on Wikipedia Commons

echo "Corrupted photos fixed!"
echo "Verifying downloads..."

for file in andy-andrist anthony-bourdain bill-bryson bill-hicks george-carlin joan-didion maya-angelou rudyard-kipling stephen-fry terry-pratchett tom-wolfe ts-eliot; do
    if [ -f "$PHOTO_DIR/${file}.jpg" ]; then
        if file "$PHOTO_DIR/${file}.jpg" | grep -E "(JPEG|PNG|GIF)" > /dev/null; then
            echo "✓ ${file}.jpg - OK"
        else
            echo "✗ ${file}.jpg - Still corrupted"
        fi
    else
        echo "✗ ${file}.jpg - Not downloaded"
    fi
done