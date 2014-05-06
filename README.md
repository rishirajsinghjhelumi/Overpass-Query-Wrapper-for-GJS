OverPass Query Wrapper for GNOME Maps
-------------------------------------

* Initial Support for POIs
* According to Query Languae at http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL

Example: 
----------

`
let qm = new OverpassQueryManager({
	'timeout' : 600,
	'outputCount' : 1000,
	'outputFormat' : 'json'
});

qm.setProperty('bbox', {
	'south_lat': 41.7,
	'west_lon': -0.4,
	'north_lat': 41.8,
	'east_lon': -88.3
});

qm.addSearchPhrase('amenity', 'pub');
qm.addSearchPhrase('amenity', 'hospital');

let pois = qm.fetchPois();
pois.forEach(function(poi){
    log(poi.tags.amenity + ":" + poi.tags.name);
});

`