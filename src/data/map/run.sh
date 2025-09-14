./structure.sh > structure.txt
./single-exit.sh > single-exit.txt

cat single-exit.txt >> structure.txt

sort -n structure.txt > structure-exits.txt

python3 character_map.py > character_map.txt  
