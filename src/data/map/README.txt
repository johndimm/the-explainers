This code parses a Shakespeare plan to create a character map showing which characters are on stage at any time.

The run.sh command file does all the work to produce character_map.txt.

My run.sh script does two scans of the text.

Scan 1:  structure

This pulls all lines with

  - ACT
  - SCENE
  - Enter
  - Exit where one or more characters are specified
  - Exeunt where all characters go off stage

It stores the lines with the byte offset in the file.  This should be enough information to determine who is on screen at any time.  But there is a problem with what you have called "generic exits".  This is an exit that applies to the current speaker.  To handle these, we do a second scan.

Scan 2:  generic exits

This pulls all lines with

  - A SPEAKER name
  - the generic exits: [_Exit._]

The next step is to construct explicit exits for each of these.  That is done in a python script that reads each line, remembers the most recent speaker, and creates an "explicit exit".  

When that is done, we concatenate these with the structure lines from the first scan, and then sort numerically to get them in the correct order.  This produces the character map.

You need to follow those steps to get an accurate character map.  

When processing a quote, you need to find its byte offset and the line in the character map that has largest byte offset less than the one of the quote.  That is quick and easy.  You are currently doing lots of runtime analysis that should not be needed.







For future reference, the analysis started with this extraction of important lines:


SPEAKERS='^[A-Z]{3,}\.\s*$'
ACTS='ACT [IV]+\.'
SCENES='SCENE [IV]+\.'
ENTERS='^\s*Enter'
EXITS='_Exit '
EXEUNTS='_Exeunt_'

COMBO="$ACTS|$SCENES|$ENTERS|$EXITS|$EXEUNTS"
grep -E -b "$COMBO" twelfth_night.txt > normal.txt
