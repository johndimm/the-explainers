#!/bin/bash

# Script to download explainer photos from Wikipedia Commons
# Usage: ./download-explainer-photos.sh

PHOTO_DIR="./public/explainer-photos"

echo "Creating photo directory..."
mkdir -p "$PHOTO_DIR"

echo "Downloading explainer photos..."

# Harold Bloom
curl -L -o "$PHOTO_DIR/harold-bloom.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/91/Harold_Bloom%2C_literary_critic%2C_author%2C_teacher_at_Yale.jpg"

# Carl Sagan
curl -L -o "$PHOTO_DIR/carl-sagan.jpg" "https://upload.wikimedia.org/wikipedia/commons/b/be/Carl_Sagan_Planetary_Society.JPG"

# Neil deGrasse Tyson
curl -L -o "$PHOTO_DIR/neil-degrasse-tyson.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Dr_Neil_deGrasse_Tyson_in_Sydney.JPG/800px-Dr_Neil_deGrasse_Tyson_in_Sydney.JPG"

# Oscar Wilde
curl -L -o "$PHOTO_DIR/oscar-wilde.jpg" "https://upload.wikimedia.org/wikipedia/commons/2/23/Oscar_Wilde.jpg"

# Stephen Fry
curl -L -o "$PHOTO_DIR/stephen-fry.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Stephen_Fry_cropped.jpg/800px-Stephen_Fry_cropped.jpg"

# Bill Bryson
curl -L -o "$PHOTO_DIR/bill-bryson.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Bill_Bryson_2012.jpg/800px-Bill_Bryson_2012.jpg"

# Maya Angelou
curl -L -o "$PHOTO_DIR/maya-angelou.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Maya_Angelou_visits_YCP_Feb_2013.jpg/800px-Maya_Angelou_visits_YCP_Feb_2013.jpg"

# Anthony Bourdain
curl -L -o "$PHOTO_DIR/anthony-bourdain.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Anthony_Bourdain_2014_%28cropped%29.jpg/800px-Anthony_Bourdain_2014_%28cropped%29.jpg"

# Douglas Adams
curl -L -o "$PHOTO_DIR/douglas-adams.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Douglas_adams_portrait_cropped.jpg/800px-Douglas_adams_portrait_cropped.jpg"

# Terry Pratchett
curl -L -o "$PHOTO_DIR/terry-pratchett.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Terry_Pratchett_-_Lucca_Comics_%26_Games_2007.jpg/800px-Terry_Pratchett_-_Lucca_Comics_%26_Games_2007.jpg"

# Joan Didion
curl -L -o "$PHOTO_DIR/joan-didion.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/7b/Joan_Didion_at_the_Brooklyn_Book_Festival.jpg"

# Mark Twain
curl -L -o "$PHOTO_DIR/mark-twain.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mark_Twain_by_AF_Bradley.jpg/800px-Mark_Twain_by_AF_Bradley.jpg"

# T.S. Eliot
curl -L -o "$PHOTO_DIR/ts-eliot.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/T._S._Eliot%2C_1919.jpg/800px-T._S._Eliot%2C_1919.jpg"

# Rudyard Kipling
curl -L -o "$PHOTO_DIR/rudyard-kipling.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Rudyard_Kipling_1895.jpg/800px-Rudyard_Kipling_1895.jpg"

# Tom Wolfe
curl -L -o "$PHOTO_DIR/tom-wolfe.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tom_Wolfe_2010.jpg/800px-Tom_Wolfe_2010.jpg"

# George Carlin
curl -L -o "$PHOTO_DIR/george-carlin.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/George_Carlin_1975.JPG/800px-George_Carlin_1975.JPG"

# Louis C.K.
curl -L -o "$PHOTO_DIR/louis-ck.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/9f/Louis_CK_2012_Shankbone_3.JPG"

# David Foster Wallace
curl -L -o "$PHOTO_DIR/david-foster-wallace.jpg" "https://upload.wikimedia.org/wikipedia/commons/e/ea/David_Foster_Wallace.jpg"

# Jerry Seinfeld
curl -L -o "$PHOTO_DIR/jerry-seinfeld.jpg" "https://upload.wikimedia.org/wikipedia/commons/c/c1/Jerry_Seinfeld_2011_Shankbone.JPG"

# Andrew Dice Clay
curl -L -o "$PHOTO_DIR/andrew-dice-clay.jpg" "https://upload.wikimedia.org/wikipedia/commons/a/a3/Andrew_Dice_Clay_Indestructible_12_lolflix.jpg"

# Howard Stern
curl -L -o "$PHOTO_DIR/howard-stern.jpg" "https://upload.wikimedia.org/wikipedia/commons/f/f8/Howard_Stern_3.jpg"

# Tina Fey
curl -L -o "$PHOTO_DIR/tina-fey.jpg" "https://upload.wikimedia.org/wikipedia/commons/2/21/Tina_Fey_%284839721355%29.jpg"

# Dave Chappelle
curl -L -o "$PHOTO_DIR/dave-chappelle.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/78/Dave_Chappelle_%28cropped%29.jpg"

# Amy Poehler
curl -L -o "$PHOTO_DIR/amy-poehler.jpg" "https://upload.wikimedia.org/wikipedia/commons/2/22/Amy_Poehler.jpg"

# Ricky Gervais
curl -L -o "$PHOTO_DIR/ricky-gervais.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/GervaisBlooms021218-21_%2844341159690%29_%28cropped%29.jpg/250px-GervaisBlooms021218-21_%2844341159690%29_%28cropped%29.jpg"

# Sarah Silverman
curl -L -o "$PHOTO_DIR/sarah-silverman.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d0/Sarah_Silverman.jpg"

# John Mulaney
curl -L -o "$PHOTO_DIR/john-mulaney.jpg" "https://upload.wikimedia.org/wikipedia/commons/0/08/John_Mulaney.jpg"

# Ali Wong
curl -L -o "$PHOTO_DIR/ali-wong.jpg" "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ali_Wong_2013.jpg"

# Bo Burnham
curl -L -o "$PHOTO_DIR/bo-burnham.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/96/BoBurnham.jpg"

# Oprah Winfrey
curl -L -o "$PHOTO_DIR/oprah-winfrey.jpg" "https://upload.wikimedia.org/wikipedia/commons/2/22/Oprah_Winfrey.jpg"

# David Letterman
curl -L -o "$PHOTO_DIR/david-letterman.jpg" "https://upload.wikimedia.org/wikipedia/commons/5/5a/Dave_Letterman.jpg"

# Conan O'Brien
curl -L -o "$PHOTO_DIR/conan-obrien.jpg" "https://upload.wikimedia.org/wikipedia/commons/f/f3/Conan_O%27Brien_%2848364150201%29.jpg"

# Stephen Colbert
curl -L -o "$PHOTO_DIR/stephen-colbert.jpg" "https://upload.wikimedia.org/wikipedia/commons/6/62/Stephen_Colbert_%2842636344214%29.jpg"

# Jimmy Fallon
curl -L -o "$PHOTO_DIR/jimmy-fallon.jpg" "https://upload.wikimedia.org/wikipedia/commons/c/cb/Jimmy_Fallon_2019_01.png"

# Ellen DeGeneres
curl -L -o "$PHOTO_DIR/ellen-degeneres.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d0/Ellen_DeGeneres.jpg"

# Trevor Noah
curl -L -o "$PHOTO_DIR/trevor-noah.jpg" "https://upload.wikimedia.org/wikipedia/commons/0/00/Trevor_Noah_June_2021_%28cropped%29_wider.png"

# John Oliver
curl -L -o "$PHOTO_DIR/john-oliver.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/John_Oliver_November_2016.jpg/250px-John_Oliver_November_2016.jpg"

# Jon Stewart
curl -L -o "$PHOTO_DIR/jon-stewart.jpg" "https://upload.wikimedia.org/wikipedia/commons/0/05/Jon_Stewart_2005.jpg"

# David Sedaris (corrected URL)
curl -L -o "$PHOTO_DIR/david-sedaris.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/David_Sedaris-4724.jpg/640px-David_Sedaris-4724.jpg"

# Flannery O'Connor
curl -L -o "$PHOTO_DIR/flannery-oconnor.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/7e/Flannery-O%27Connor_1947.jpg"

# Humphrey Bogart
curl -L -o "$PHOTO_DIR/humphrey-bogart.jpg" "https://upload.wikimedia.org/wikipedia/commons/a/a0/Humphrey_Bogart_publicity.jpg"

# Anthony Jeselnik
curl -L -o "$PHOTO_DIR/anthony-jeselnik.jpg" "https://upload.wikimedia.org/wikipedia/commons/2/22/Anthony_Jeselnik_in_2012.jpg"

# Doug Stanhope
curl -L -o "$PHOTO_DIR/doug-stanhope.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d5/Doug_Stanhope_-_2010.jpg"

# Jim Norton
curl -L -o "$PHOTO_DIR/jim-norton.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/93/Jim_Norton_photo_by_Josh_Alder.jpg"

# Daniel Tosh
curl -L -o "$PHOTO_DIR/daniel-tosh.jpg" "https://upload.wikimedia.org/wikipedia/commons/a/ac/Daniel_Tosh.jpg"

# Bill Burr
curl -L -o "$PHOTO_DIR/bill-burr.jpg" "https://upload.wikimedia.org/wikipedia/commons/4/41/Bill_Burr_%2842698437685%29.jpg"

# Lewis Black
curl -L -o "$PHOTO_DIR/lewis-black.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d3/Stand-up_comedian_Lewis_Black%2C_2009.JPG"

# Sam Kinison
curl -L -o "$PHOTO_DIR/sam-kinison.jpg" "https://upload.wikimedia.org/wikipedia/commons/f/f4/Sam_Kinison.jpg"

# Paul Mooney
curl -L -o "$PHOTO_DIR/paul-mooney.jpg" "https://upload.wikimedia.org/wikipedia/commons/1/15/PaulMooneyDec09.jpg"

# Bill Hicks
curl -L -o "$PHOTO_DIR/bill-hicks.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Bill_Hicks_1991.jpg/800px-Bill_Hicks_1991.jpg"

# Bob Saget
curl -L -o "$PHOTO_DIR/bob-saget.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/98/Bob_Saget.jpg"

echo "Download complete! Photos saved to $PHOTO_DIR"
echo "Note: Some explainers (jim-jefferies, andy-andrist) don't have quality photos on Wikipedia Commons."