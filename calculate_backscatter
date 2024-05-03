//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Generate Analysis and Plots for Sentinel 1 MSI
// Link: https://code.earthengine.google.com/5b5d9f97c17ab07900aecaa90e69d6d3
// Description:
// This script is used to process (speckle filter and image mosaic) Sentinel data and produce plots of VV and VH backscattering over the West Kobuk study area
// Running this code requires a digitized river study area used for clipping satellite imagery. Note that scripts for the other river areas (East Kobuk and
// Colville) are identical, with the exception of the filter bounds function argument when initially loading SAR imagery
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
// Define variables for study period
var start = '2022-09-01'; // start date
var end = '2022-11-30'; // end date
var SMOOTHING_RADIUS = 50;
 
// Pull image collection with filters and select VV and VH bands
 var s1_collection = ee.ImageCollection("COPERNICUS/S1_GRD")
   .filter(ee.Filter.eq('instrumentMode', 'IW'))
   .filterMetadata('resolution_meters', 'equals', 10)
   .filterBounds(westkobuk)
   .filterDate(start, end)
   .select('VV', 'VH');

 print(s1_collection)

 // Separate image colleciton for ascending and descending
 var asc_collection = s1_collection.filter((ee.Filter.eq('orbitProperties_pass', 'ASCENDING')));
 var desc_collection = s1_collection.filter((ee.Filter.eq('orbitProperties_pass', 'DESCENDING')));
print(desc_collection, 'desc')

// group images by day
var distinctDates = asc_collection
 	.map(function(image) {
   	return ee.Feature(null, {'date': image.date().format('YYYY-MM-dd')})
 	})
 	.distinct('date')
 	.aggregate_array('date')

// create mosaic of grouped images
var createMosaic = function(date) {
   var filtered1 = asc_collection.filterDate(date, date.advance(1, 'day'));
   var mosaic = filtered1.mosaic();
   // Set all original properties to the mosaic image
   return mosaic.set('system:time_start', date);
 };
 
var mosaicCollection = ee.ImageCollection.fromImages(
   distinctDates.map(function(date) {
 	return createMosaic(ee.Date(date));
   })
 );
 
print(mosaicCollection, 'mosaic')

// implement speckle filter and get mean pixel values
 var clip_filter = function(image) {
   // clip image to the river 
   var clipped_image = image.clip(westkobuk);

   // remove speckles 
   var filtered = clipped_image.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');

   // find the mean of the vv band
   var vv_mean = filtered.select('VV').reduceRegion({
 	reducer: ee.Reducer.mean(),
 	geometry: westkobuk,
 	scale: 10 // Adjust the scale as per your requirement
   }).get('VV');

   // find the mean of the vh band 
   var vh_mean = filtered.select('VH').reduceRegion({
 	reducer: ee.Reducer.mean(),
 	geometry: westkobuk,
 	scale: 10 // Adjust the scale as per your requirement
   }).get('VH');

   // add the mean values as properties of the image 
   filtered = filtered.set('VV_mean', vv_mean)
   filtered = filtered.set('VH_mean', vh_mean)

   var date = ee.Date(image.get('system:time_start'));

   filtered = filtered.set('image_date', date);
 
  return filtered
 }

// implement function over image collection
var filtered_collection_asc = mosaicCollection.map(clip_filter);
var filtered_collection_desc = desc_collection.map(clip_filter);
 
 
// PLOTTING //
 
// Create a feature collection for plotting VH mean for both ascending and descending image collections
 var combinedVHFeatureCollection = filtered_collection_asc.map(function (image) {
   return ee.Feature(null, {
 	'date': ee.Date(image.get('image_date')),
 	'VH_mean': image.get('VH_mean'),
 	'orbit': 'Ascending'
   });
 // used code from StackOverflow to iterate over image collections https://stackoverflow.com/questions/55384915/apply-a-function-over-2-consecutive-images-in-an-imagecollection-in-google-earth
 }).merge(filtered_collection_desc.map(function (image) {
   return ee.Feature(null, {
 	'date': ee.Date(image.get('image_date')),
 	'VH_mean': image.get('VH_mean'),
 	'orbit': 'Descending'
   });
 }));
 
// Plot the combined feature collection for VH mean
 var chartCombinedVH = ui.Chart.feature.byFeature(combinedVHFeatureCollection, 'date', ['VH_mean'])
   .setChartType('ScatterChart')
   .setOptions({
 	title: 'VH Mean Over Time (Ascending and Descending)',
 	hAxis: {
   	title: 'Date',
   	format: 'MM-dd-yyyy',
 	},
 	vAxis: {
   	title: 'VH Mean',
   	viewWindow: {  
     	min: -34,      
     	max: -18       
   	}
 	},
 	pointSize: 3,
 	trendlines: {
   	0: {
     	type: 'polynomial',
     	color: 'red',
     	lineWidth: 2,
     	opacity: 0.8,
     	showR2: true,
   	}
 	}
   });

 print(chartCombinedVH)
