#!/usr/bin/gjs

const Lang = imports.lang;
const Signals = imports.signals;
const Soup = imports.gi.Soup;
const Format = imports.format;
const Geocode = imports.gi.GeocodeGlib;

const _DEFAULT_TIMEOUT = 180;
const _DEFAULT_MAXSIZE = 536870912;
const _DEFAULT_OUTPUT_FORMAT = "json";
const _DEFAULT_OUTPUT_COUNT = 1e6;
const _DEFAULT_OUTPUT_INFO = "body";
const _DEFAULT_OUTPUT_SORT_ORDER = "qt";

const _UNKNOWN = "Unknown";

const BASE_URL = "http://overpass-api.de/api/interpreter";

function convertJSONPlaceToGeocodePlace(place) {

    let location = new Geocode.Location({
        latitude:    place.lat,
        longitude:   place.lon,
        accuracy:    0,
        description: place.id.toString() // PONDER : Whether this should be id or name
                                         // as Geocode has no option for a location id.
                                         // or reverse_gecode this.
    });

    let name = _UNKNOWN;
    if(place.tags)
        name = place.tags.name || _UNKNOWN;

    let geocodePlace = Geocode.Place.new_with_location(
        name,
        Geocode.PlaceType.POINT_OF_INTEREST,
        // TODO : Add against PlaceType
        // Create a data structure which return Place Type for
        // the corresponding place.tags.(amenity | historic | highway ....)
        // Example : "hospital" => "Place.Type.HOSPITAL"
        //           "healthcare" => "Place.Type.HOSPITAL"
        //           "bus_stop" => "Place.Type.BUS_STOP"
        // Add Bugs against the types not in Geocode
        location
    );

    return geocodePlace;
}

const OverpassQueryManager = new Lang.Class({
    Name: 'OverpassQueryManager',

    _init: function(params) {

    	// maximum allowed runtime for the query in seconds
    	this.timeout = params.timeout || _DEFAULT_TIMEOUT;

    	//  maximum allowed memory for the query in bytes RAM on the server
    	this.maxsize = params.maxsize || _DEFAULT_MAXSIZE;

    	// output format : json or xml
    	this.outputFormat = params.outputFormat || _DEFAULT_OUTPUT_FORMAT;

    	// maximum number of results the output must contain
    	this.outputCount = params.outputCount || _DEFAULT_OUTPUT_COUNT;

    	// data output info must contain : ids, skel, body, meta
    	this.outputInfo = params.outputInfo || _DEFAULT_OUTPUT_INFO;

    	// data sort order : qt(fastest based on geography), ids, asc
    	this.outputSortOrder = params.outputSortOrder || _DEFAULT_OUTPUT_SORT_ORDER;

    	// Types of phrases we want to search : pub, school, hospital etc
    	this.searchPhrases = [];

    	// Area of Search
    	this.bbox = null;

    	// HTTP Request Variables
    	this.session = new Soup.SessionAsync();
    },

    setProperty: function(property, value) {
    	this[property] = value;
    },

    getProperty: function(property) {
    	return this[property];
    },

    addSearchPhrase: function(key, value){

    	// The special phrase supported by OSM can be found at:
    	// http://wiki.openstreetmap.org/wiki/Nominatim/Special_Phrases/EN

    	this.searchPhrases.push({
    		'type': key,
    		'value': value
    	});
    },

    fetchPois: function() {
    	let query = this._generateOverpassQuery();
    	let url = Format.vprintf("%s?data=%s",
    		[
    			BASE_URL,
    			query
    		]);
        log(url);
    	let uri = new Soup.URI(url);
    	let request = new Soup.Message({method:"GET", uri:uri});
		this.session.send_message(request);
		return JSON.parse(request.response_body.data)['elements'];
    },

    _generateOverpassQuery: function() {

    	let query = Format.vprintf("%s%s%s%s;(%s);%s;",
    		[
    			this._getBoundingBoxString(),
	    		this._getKeyValueString('timeout', this.timeout),
	    		this._getKeyValueString('out', this.outputFormat),
	    		this._getKeyValueString('maxsize', this.maxsize),
	    		this._getPhraseString(),
	    		this._getOutputString()
    		]);
    	return query;
    },

    _getBoundingBoxString: function() {
    	return Format.vprintf("[bbox:%s,%s,%s,%s]",
    		[
    			this.bbox.south_lat,
    			this.bbox.west_lon,
    			this.bbox.north_lat,
    			this.bbox.east_lon
    		]);
    },

    _getKeyValueString: function(key, value) {
    	return Format.vprintf("[%s:%s]",
    		[
    			key,
    			value
    		]);
    },

    _getPhraseString: function() {

    	let phraseString = '';
    	this.searchPhrases.forEach(function(phrase){
    		phraseString += Format.vprintf('node["%s"="%s"];',
    			[
    				phrase.type,
    				phrase.value
    			]);
    	});
    	return phraseString;
    },

    _getOutputString: function() {
    	return Format.vprintf("out %s %s %s",
    		[
    			this.outputInfo,
    			this.outputSortOrder,
    			this.outputCount,
    		]);
    }

});
// Signals.addSignalMethods(OverpassQueryManager.prototype);

let qm = new OverpassQueryManager({
    'timeout' : 600,
    'outputCount' : 1000,
    'outputFormat' : 'json'
});

// qm.setProperty('timeout', 100);
// log(qm.getProperty('timeout'));
// log(qm.getProperty('outputCount'));
// log(qm.getProperty('outputSortOrder'));

qm.setProperty('bbox', {
	'south_lat': 41.7,
	'west_lon': -0.4,
	'north_lat': 41.8,
	'east_lon': -88.3
});

// qm.addSearchPhrase('amenity', 'school');
qm.addSearchPhrase('amenity', 'pub');
qm.addSearchPhrase('amenity', 'hospital');

// qm.searchPhrases.forEach(function(phrase){
// 	log(phrase.type + "," + phrase.value);
// });

// log(qm._getKeyValueString('timeout', 180));
// qm._generateOverpassQuery();
// log(qm._getPhraseString());

let pois = qm.fetchPois();
for (var i = 0; i < pois.length; i++) {
    pois[i] = convertJSONPlaceToGeocodePlace(pois[i]);
};

pois.forEach(function(poi){
    log(poi);
});
