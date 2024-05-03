# DetectRiverIce
**Project:** Alaskan River Ice Detection Through NASA Imagery

**Code Contact:** Ben Silver, [benjaminsilver17@gmail.com]       

## Introduction  
My team developed this code to analyze annual ice cover between 2017 and 2023. Google Earth
Engine (GEE) was used to process satellite imagery and calculate various spectral reflectance
indices for identifying ice. The analysis yielded various plots and maps depicting ice coverage
quantities, formation date, and phase changes throughout the study area.

## Applications and Scope   
The following code can be used to process Landsat 8/9 OLI and Sentinel 1/2 MSI (Level 2 surface
reflectance and Ground Range Detected) datasets. The following code is useful for determining
whether caribou crossings are feasible at locations throughout the Colville and Kobuk river.
Stakeholders can use this code to calculate mean RDRI and NDII values over a given study area. The
code can be adjusted to generate summary statistics for any year and maximum image cloud cover
threshold.

## Capabilities
1. Join Sentinel 2 Cloud Probability dataset to Sentinel 2 surface reflectance data to generate
cloud masks
2. Assemble daily image mosaics across Landsat and Sentinel image collections
3. Analyze and plot ice spectral reflectance indices over annual image collections
4. Analyze and plot VV and VH backscatter values over annual image collections
5. Fit spline interpolations to annual time series plots

## Interfaces 
The team used Google Earth Engine and R for image processing, analysis, and visualization.

### Languages
Google Earth Engine scripts were written in JavaScript, and R scripts were written in R.

## Parameters

1. Acquire Google Earth Engine login
2. Load satellite imagery
3. Digitize river study area polygons using Sentinel 1 imagery before ice formation
4. Specify desired year, area, and output file name for aggregating index summary statistics 
5. Export summary tables as CSVs

## Assumptions, Limitations, & Errors
Google Earth Engine did not contain images during the annual study period (September and
October) for 2017 and 2018. Many years had limited data availability due to the low temporal
resolution of Landsat and Sentinel imagery (16 and 10 days, respectively). While the Sentinel-2
cloud mask is relatively effective, no feasible cloud mask could be generated for the Landsat 8/9
data. Thus, each image below the 30% cloud cover threshold was inspected for viability.

## Support
See the GEE Datasets Catalog (https://developers.google.com/earth-engine/datasets/catalog) for
GEE technical support. For R function documentation, visit https://www.rdocumentation.org/

## Acknowledgments
- Additional Team Members: Christian Sarro, Mahnoor Naem, and Levi Mitchell
- Team Lead: Madison Arndt
- Science Advisor: Dr. Cedric Fichot (Boston University)
- Addtional Support: Seymour Zhu (Boston University)

