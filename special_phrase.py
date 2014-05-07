from BeautifulSoup import BeautifulSoup
import urllib2

NOMINATIM_SPECIAL_PHRASE_URL = "http://wiki.openstreetmap.org/wiki/Nominatim/Special_Phrases/EN"
OUTPUT_FILE = "nominatim_special_phrases.csv"

def getSpecialPhrases():
	
	specialPhrases = {}
	phraseTypes = set() # To remove duplicates('s', 'es', 'in', 'near')

	htmlText = urllib2.urlopen(NOMINATIM_SPECIAL_PHRASE_URL).read()
	soup = BeautifulSoup(htmlText)

	rows = soup.find("table", {"class" : "wikitable sortable"}).findAll('tr')[1:]
	for row in rows:

		phrase, key, value, _, _ = row.findAll('td')
		if value.text not in phraseTypes:
			specialPhrases[phrase.text] = {
				'type': key.text,
				'value': value.text
			}
			phraseTypes.add(value.text)

	return specialPhrases

def writePhrasesAsCSV(phrases):

	csvWriter = open(OUTPUT_FILE, 'wb')
	csvWriter.write('%s,%s,%s\n'%('Phrase', 'Key', 'Value'))
	for phrase in phrases:
		csvWriter.write('%s,%s,%s\n'%(phrase, phrases[phrase]['type'], phrases[phrase]['value']))
	csvWriter.close()

if __name__ == '__main__':
	
	specialPhrases = getSpecialPhrases()
	writePhrasesAsCSV(specialPhrases)
