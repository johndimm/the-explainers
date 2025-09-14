#!/bin/bash

# Scan 1: Extract structure lines (ACT, SCENE, Enter, Exit, Exeunt)
ACTS='ACT [IV]+\.'
SCENES='SCENE [IV]+\.'
ENTERS='^\s*Enter'
EXITS='_Exit '
EXEUNTS='_Exeunt_'

COMBO="$ACTS|$SCENES|$ENTERS|$EXITS|$EXEUNTS"
grep -E -b "$COMBO" twelfth-night.txt

