import urllib2

INFO_URL = "http://taginfo.openstreetmap.org/api/4/tag/stats?key=%s&value=%s&sortname=&sortorder="
PHRASE_CSV_FILE = "nominatim_special_phrases.csv"
OUTPUT_FILE = "nominatim_phrase_info.csv"

def getTagInfo(key, value):

	requestURL = INFO_URL%(key, value)
	data = urllib2.urlopen(requestURL).read()
	data = eval(data)

	return data

if __name__ == '__main__':

	phrases = open(PHRASE_CSV_FILE)

	csvWriter = open(OUTPUT_FILE, 'wb')
	csvWriter.write('%s,%s,%s,%s,%s\n'%('Phrase', 'Key', 'Value', 'count', 'count_fraction'))
	
	for line in phrases.read().split('\n')[1:]:
		phrase, key, value = line.strip().split(",")
		phraseInfo = getTagInfo(key, value)
		csvWriter.write('%s,%s,%s,%s,%s\n'%(
			phrase, 
			key, 
			value,
			phraseInfo['data'][1]['count'],
			phraseInfo['data'][1]['count_fraction']

			# 0 is for all
			# 1 is for nodes
			# 2 is for ways
			# 3 is for relations
		))

	csvWriter.close()