//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Generate Ice Index Summary Tables for Sentinel 2 MSI
// Link: https://code.earthengine.google.com/ab4910ea8689d17b08f41de69e8014d5
// Description: This script is used to process (cloud mask and image mosaic) and analyze (index calculations) Sentinel data over the East Kobuk River. Running this code requires a digitized river study area used for clipping satellite imagery. Note that scripts for the other river areas (West Kobuk and Colville) are identical, with the exception of the ‘geo’ variable and map center.
// Output:
// This code yields mean NDWI, NDII, and RDRI values for each day for pixels over the user-specified time interval
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// define start and end time
var startDate = '2022-09-01';
var endDate = '2022-11-30';
var cloudThresh = 30; // max number of acceptable cloud coverage
var imageNumber = 2;
var outputName = 'EastKobuk2023_sentinel';
var geo = eastkobuk;

// set map properties
Map.setCenter(-157.7384, 67.0017, 9);
var vizParams = {
  min: 0.0,
  max: 2500,
  bands: ['B4', 'B3', 'B2'],
  gamma: 0.6
};
var colors = ['red', 'yellow', 'green', 'cyan', 'blue']; //index color palette
 
// join sentinel and cloud probability layers

function combineData(aoi, start_date, end_date) {
  // S2 SR data
  var s2_sr_col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', cloudThresh))
    .map(function(image){return image.clip(aoi)});

// Get cloud probabilities
  var s2_cloudless_col = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
    .filterBounds(aoi)
    .filterDate(start_date, end_date)
    .map(function(image){return image.clip(aoi)});

 // Join collections

  var join = ee.Join.saveFirst('s2cloudless').apply({
    primary: s2_sr_col,
    secondary: s2_cloudless_col,
    condition: ee.Filter.equals({
      leftField: 'system:index',
      rightField: 'system:index'
    })
  });

  return ee.ImageCollection(join);
}

var joinedData = combineData(geo, startDate, endDate);
print(joinedData);

// add cloud bands
function addCloudBands(img) {
    var cloudProb = ee.Image(img.get('s2cloudless')).select('probability');
    var CLD_PRB_THRESH = 50;
    var isCloud = cloudProb.gt(CLD_PRB_THRESH).rename('clouds');
    return img.addBands(ee.Image([cloudProb, isCloud]));
}
var joinedData = joinedData.map(addCloudBands);

//apply cloud mask
function maskClouds(image) {
  var clouds = image.select('clouds');
  var cloudMask = clouds.eq(0);
  var maskedImage = image.updateMask(cloudMask);
  return maskedImage;
}

var maskedCollection = joinedData.map(maskClouds);

// // view masked image example (TODO delete)
// var imageList3 = maskedCollection.toList(maskedCollection.size());
// var image3 = ee.Image(imageList3.get(0));
// Map.addLayer(image3, vizParams, 'Masked Image (No Mosaic)')

//create mosaics for each day
var distinctDates = maskedCollection
    .map(function(image) {
      return ee.Feature(null, {'date': image.date().format('YYYY-MM-dd')});
    })
    .distinct('date')
    .aggregate_array('date');
    
print(distinctDates)

// generate mosaic function
var createMosaic = function(date) {
  var filtered = maskedCollection.filterDate(date, date.advance(1, 'day'));
  var mosaic = filtered.mosaic();
  return mosaic.set('system:time_start', date);  // Set all original properties to the mosaic image
};

var mosaicCollection = ee.ImageCollection.fromImages(
  distinctDates.map(function(date) {
    return createMosaic(ee.Date(date));
  })
);

// add mosaic collection and individual images to map
Map.addLayer(mosaicCollection, vizParams, 'Mosaic Masked Collection', false);

var imageList1 = mosaicCollection.toList(mosaicCollection.size());
var image1 = ee.Image(imageList1.get(2));

Map.addLayer(image1, vizParams, 'Mosaic Masked Image', false);

// NDWI mean calculations

var calculateNDWI = function(image) {
  var date = ee.Date(image.get('system:time_start')); // TOMORROW
  var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
  ndwi = ndwi.set('system:time_start', date); // TOMORROW
  return ndwi;
};

var ndwiCollection = mosaicCollection.map(calculateNDWI);

// used reducer function from https://developers.google.com/earth-engine/guides/reducers_intro
var ndwiMean = function(image){
  var date = ee.Date(image.get('system:time_start')).format("YYYY-MM-dd");
  var ndwi_mean_test = image.select('NDWI').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geo,
      scale: 10
    }).get('NDWI');
    
  image = image.set('ndwi_mean', ndwi_mean_test);
  image = image.set('system:time_start', date); // TOMORROW
  
  return image;
};

var ndwiCollection = ndwiCollection.map(ndwiMean);

// load an image (NDWI) - for testing
var imageList = ndwiCollection.toList(ndwiCollection.size());
var specificImage = ee.Image(imageList.get(2));
Map.addLayer(specificImage,{palette: colors}, 'NDWI', false);

// NDWI SWIR mean calculations

var calculateNDWI_SWIR = function(image) {
  var date = ee.Date(image.get('system:time_start')); // TOMORROW
  var ndwi_swir = image.normalizedDifference(['B3', 'B11']).rename('NDWI_SWIR');
  ndwi_swir = ndwi_swir.set('system:time_start', date); // TOMORROW
  return ndwi_swir;
};

var ndwi_swirCollection = mosaicCollection.map(calculateNDWI_SWIR);

// calculate mean values over images
// used reducer function from https://developers.google.com/earth-engine/guides/reducers_intro
var ndwi_swirMean = function(image){
  var date = ee.Date(image.get('system:time_start')).format("YYYY-MM-dd");
  var ndwi_swir_mean_test = image.select('NDWI_SWIR').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geo,
      scale: 10
    }).get('NDWI_SWIR');
    
  image = image.set('ndwi_swir_mean', ndwi_swir_mean_test);
  image = image.set('system:time_start', date); // TOMORROW
  
  return image;
};

var ndwi_swirCollection = ndwi_swirCollection.map(ndwi_swirMean);

// load an image (NDWI SWIR)
var imageList2 = ndwi_swirCollection.toList(ndwi_swirCollection.size());
var specificImage2 = ee.Image(imageList2.get(2));
Map.addLayer(specificImage2,{palette: colors}, 'NDWI SWIR', false);

// NIR SWIR Collection

var calculateNIR_SWIR = function(image) {
  var date = ee.Date(image.get('system:time_start')); // TOMORROW
  var nir_swir = image.normalizedDifference(['B8', 'B11']).rename('NIR_SWIR');
  nir_swir = nir_swir.set('system:time_start', date); // TOMORROW
  return nir_swir;
};

var nir_swirCollection = mosaicCollection.map(calculateNIR_SWIR);

var nir_swirMean = function(image){
  var date = ee.Date(image.get('system:time_start')).format("YYYY-MM-dd");
  var nir_swir_mean_test = image.select('NIR_SWIR').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geo,
      scale: 10
    }).get('NIR_SWIR');
  image = image.set('nir_swir_mean', nir_swir_mean_test);
  image = image.set('system:time_start', date); // TOMORROW
  
  return image;
};

var nir_swirCollection = nir_swirCollection.map(nir_swirMean);

// load an image (NIR SWIR)
var imageList3 = nir_swirCollection.toList(nir_swirCollection.size());
var specificImage3 = ee.Image(imageList3.get(2));
Map.addLayer(specificImage3,{palette: colors}, 'NIR SWIR', false);

// RDRI calulation
var calculateRDRI = function(image) {
  var date = ee.Date(image.get('system:time_start')); // TOMORROW
  var rdri = image.expression('(red-nir)/(nir-swir)',
  {'red' : image.select ('B4'),
  'nir': image.select ('B8'),
  'swir' : image.select ('B11')}
  ).rename('RDRI');
  
  rdri = rdri.set('system:time_start', date); // TOMORROW
  return rdri;
};

var rdriCollection = mosaicCollection.map(calculateRDRI);

var rdriMean = function(image){
  var date = ee.Date(image.get('system:time_start')).format("YYYY-MM-dd");
  var rdri_mean_test = image.select('RDRI').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geo,
      scale: 10
    }).get('RDRI');
  image = image.set('rdri_mean', rdri_mean_test);
  image = image.set('system:time_start', date); // TOMORROW
  
  return image;
};

var rdriCollection = rdriCollection.map(rdriMean);

// load an image (NIR SWIR)
var imageList4 = rdriCollection.toList(rdriCollection.size());
var specificImage4 = ee.Image(imageList4.get(2));
Map.addLayer(specificImage4,{palette: colors}, 'RDRI', false);

// export index data to table

var dates_list = ee.List(ndwiCollection.aggregate_array("system:time_start"));
var ndwi_list = ee.List(ndwiCollection.aggregate_array("ndwi_mean"));
var ndwi_swir_list = ee.List(ndwi_swirCollection.aggregate_array("ndwi_swir_mean"));
var nir_swir_list = ee.List(nir_swirCollection.aggregate_array("nir_swir_mean"));
var rdri_list = ee.List(rdriCollection.aggregate_array("rdri_mean"));

var features = ee.FeatureCollection(
  ee.List.sequence(0, dates_list.length().subtract(1)).map(function(i) {
    var listProperties = {
      'Dates': ee.Number(dates_list.get(i)),
      'NDWI': ee.Number(ndwi_list.get(i)),
      'NDWI_SWIR': ee.Number(ndwi_swir_list.get(i)),
      'NIR_SWIR': ee.Number(nir_swir_list.get(i)),
      'RDRI': ee.Number(rdri_list.get(i))
    };
    return ee.Feature(null, listProperties);
  })
);

// add mosaic collection and individual images to map
var imageList1 = mosaicCollection.toList(mosaicCollection.size());
var image1 = ee.Image(imageList1.get(1));

Map.addLayer(image1, vizParams, 'Mosaic Masked Image2', true);

// send final data to drive
Export.table.toDrive({
  collection: features,
  description: outputName,
  folder: 'SummaryTables',
  fileFormat: 'CSV'
});

// utility function to identify empty images
// used reducer function from https://developers.google.com/earth-engine/guides/reducers_intro
// function calculateMaskedPercent(image) {
//   var maskedPixelCount = image.select('B1').reduceRegion({
//     reducer: ee.Reducer.count(),
//     geometry: geo,
//     scale: 30,
//     maxPixels: 1e9
//   }).get('B1');

// used reducer function from https://developers.google.com/earth-engine/guides/reducers_intro
//   var totalPixelCount  = image.unmask().select('B1').reduceRegion({
//     reducer: ee.Reducer.count(),
//     geometry: geo,
//     scale: 30,
//     maxPixels: 1e9
//   }).get('B1');
 
//   var cloud_cover_roi = ee.Number(1)
//       .subtract(ee.Number(maskedPixelCount).divide(totalPixelCount))
//       .multiply(100)
//   return cloud_cover_roi;
// }

// var number = calculateMaskedPercent(image1);
// print(number)
