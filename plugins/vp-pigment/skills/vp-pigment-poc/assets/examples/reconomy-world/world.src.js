(function () {
  'use strict';
  // ====================================================================================================
  // BRAND AND MODEL SETTINGS: the only block another customer changes (together with the bindings in
  // build_world.py). Everything on the globe (businesses, countries, Loops, schemes, numbers, statuses)
  // is read from the model through data sources; the code only holds styling, item names of P&L lines,
  // and generic reference geography (country centroids and coarse land outlines).
  // ====================================================================================================
  var BRAND = {
    name: 'Reconomy',
    title: 'Reconomy world',
    sub: 'Where the November forecast is earned: next 12 months, Nov 26 to Oct 27',
    pills: ['Forecast Nov 26', 'Next 12 months', 'Illustrative data'],
    version: 'Forecast Nov 26',
    currency: '£',
    lines: { rev: 'Revenue', gp: 'Gross profit', eb: 'Adjusted EBITDA' },
    plOrder: ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'],
    subtotals: { 'Gross profit': 1, 'Adjusted EBITDA': 1 },
    status: { 'Not started': '#94A3B8', 'In progress': '#F2C94C', 'Submitted': '#9B87FF', 'Returned': '#FF6B70', 'Approved': '#00CF42' },
    C: { navy: '#014664', navy2: '#00344B', blue: '#215DDB', green: '#00CF42', teal: '#0BA5A5', gold: '#F2C94C', coral: '#FF6B70', sky: '#8EB4F5', cloud: '#BFD1E3', ink: '#10283A', text: '#EAF3F8', mut: '#93AFC2', space: '#020D16', deep: '#062A3F', land: '#8FD3E4' },
    series: ['#00CF42', '#4C8DFF', '#13D0C8', '#F2C94C', '#A08CFF', '#FF8A5B', '#8EB4F5'],
    FONT: "'Montserrat', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    logo: '<svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="#ffffff"/><path d="M14 5a9 9 0 0 1 8.5 6" fill="none" stroke="#00CF42" stroke-width="3.2" stroke-linecap="round"/><path d="M22.6 16.5A9 9 0 0 1 9 21.8" fill="none" stroke="#215DDB" stroke-width="3.2" stroke-linecap="round"/><path d="M6.2 18.4A9 9 0 0 1 10 6" fill="none" stroke="#014664" stroke-width="3.2" stroke-linecap="round"/></svg>'
  };

  // ---------- reference geography: not business data ----------
  // Country centroids [lat, lon]. Add rows for any country a customer's model uses.
  var GEO = {
    'United Kingdom': [54.0, -2.3], 'Ireland': [53.2, -8.0], 'France': [46.6, 2.4], 'Germany': [51.1, 10.4], 'Netherlands': [52.2, 5.5], 'Belgium': [50.6, 4.6],
    'Luxembourg': [49.8, 6.1], 'Switzerland': [46.8, 8.2], 'Austria': [47.6, 14.1], 'Italy': [42.8, 12.6], 'Spain': [40.2, -3.6], 'Portugal': [39.6, -8.0],
    'Denmark': [56.0, 9.3], 'Sweden': [62.2, 15.6], 'Norway': [61.4, 9.0], 'Finland': [63.5, 26.5], 'Iceland': [64.9, -18.6], 'Poland': [52.0, 19.4],
    'Czech Republic': [49.8, 15.5], 'Slovakia': [48.7, 19.7], 'Hungary': [47.2, 19.4], 'Romania': [45.9, 24.9], 'Bulgaria': [42.7, 25.3], 'Greece': [39.3, 22.0],
    'Croatia': [45.1, 15.2], 'Slovenia': [46.1, 14.8], 'Serbia': [44.0, 20.9], 'Estonia': [58.7, 25.5], 'Latvia': [56.9, 24.6], 'Lithuania': [55.3, 23.9],
    'Ukraine': [49.0, 31.4], 'Turkey': [39.0, 35.2], 'Russia': [61.5, 96.0], 'Israel': [31.0, 34.9], 'Saudi Arabia': [23.9, 45.1], 'United Arab Emirates': [23.4, 53.8],
    'Egypt': [26.8, 30.8], 'Morocco': [31.8, -7.1], 'Nigeria': [9.1, 8.7], 'Kenya': [0.2, 37.9], 'South Africa': [-29.0, 25.0], 'India': [22.4, 79.0],
    'Pakistan': [30.4, 69.3], 'Bangladesh': [23.7, 90.4], 'China': [35.9, 104.2], 'Hong Kong': [22.3, 114.2], 'Taiwan': [23.7, 121.0], 'Japan': [36.2, 138.3],
    'South Korea': [36.5, 127.9], 'Singapore': [1.35, 103.8], 'Malaysia': [4.2, 102.0], 'Indonesia': [-2.5, 118.0], 'Thailand': [15.9, 100.9], 'Vietnam': [14.1, 108.3],
    'Philippines': [12.9, 121.8], 'Australia': [-25.3, 133.8], 'New Zealand': [-41.0, 174.9], 'United States': [39.5, -98.4], 'Canada': [56.1, -106.3],
    'Mexico': [23.6, -102.6], 'Brazil': [-10.3, -53.1], 'Argentina': [-35.4, -65.2], 'Chile': [-35.7, -71.5], 'Colombia': [4.1, -72.9], 'Peru': [-9.2, -75.0]
  };
  var ALIAS = { 'uk': 'United Kingdom', 'great britain': 'United Kingdom', 'gb': 'United Kingdom', 'england': 'United Kingdom', 'scotland': 'United Kingdom', 'wales': 'United Kingdom',
    'us': 'United States', 'usa': 'United States', 'united states of america': 'United States', 'czechia': 'Czech Republic', 'holland': 'Netherlands', 'the netherlands': 'Netherlands',
    'uae': 'United Arab Emirates', 'korea': 'South Korea', 'republic of ireland': 'Ireland' };
  // Regions [lat, lon, radius in degrees]; worldwide names become an orbit around the globe
  var REGION = { 'europe': [50, 12, 16], 'european union': [50, 12, 16], 'emea': [35, 15, 32], 'north america': [45, -100, 22], 'latin america': [-12, -62, 24], 'south america': [-15, -60, 20],
    'asia pacific': [8, 115, 30], 'apac': [8, 115, 30], 'asia': [35, 95, 30], 'middle east': [27, 45, 12], 'africa': [3, 20, 30], 'nordics': [62, 16, 9], 'dach': [48.5, 10.8, 4.5],
    'benelux': [51, 5, 2.4], 'oceania': [-28, 140, 22] };
  var WORLDWIDE = { 'worldwide': 1, 'global': 1, 'international': 1, 'world': 1, 'all countries': 1 };
  // Coarse land outlines [lon, lat, lon, lat, ...]; the globe samples them into a dot matrix. Even-odd: a shape inside another is water.
  var LAND = [
    // North America
    [-168,65.6,-166,68.4,-163,69.8,-158,70.8,-156,71.3,-152,70.8,-145,70.1,-141,69.7,-136,69,-130,70,-124,69.6,-117,68.8,-110,68,-105,68.5,-98,68,-95,68.7,-92,69.5,-88,68.5,-85,69.8,-82,68,-81.5,66.5,-85,66,-87,64.5,-90.5,63.5,-94,61,-94.5,59,-93,58.7,-89,56.8,-85,55.3,-82.3,55,-80.5,51.5,-79,54,-77,56,-77,59,-78,61,-77.5,62.5,-74,62.5,-71,61.3,-69.5,59,-66,58.6,-64.5,60.3,-61.5,56.5,-58,54.5,-56,52,-57.5,50.8,-60.5,50.2,-64,50.2,-66.5,50,-64.8,49,-65,48,-64.5,47,-61.5,45.8,-60,45.8,-61,45,-63.5,44.5,-65.8,43.8,-66.8,44.8,-68.5,44.3,-70.2,43.6,-70.7,42.5,-70,41.7,-71.5,41.4,-73.7,40.7,-74,40.4,-74.1,39.6,-75,38.8,-75.6,37.5,-76,36.8,-75.6,35.5,-76.5,34.7,-77.8,34,-79,33.3,-80.5,32.2,-81.3,31,-81.3,29.8,-80.6,28.2,-80.1,26.5,-80.4,25.2,-81.1,25.2,-81.8,26.4,-82.7,27.8,-82.8,29,-84,30,-85.4,29.8,-86.5,30.4,-88.5,30.3,-89.5,30.2,-89.2,29.1,-90.5,29.1,-92,29.6,-93.8,29.7,-95,29.2,-96.5,28.1,-97.3,27.2,-97.5,25.5,-97.7,23.5,-97.5,21.7,-96.5,19.8,-95.5,18.7,-94.4,18.2,-92.5,18.6,-91.2,18.8,-90.5,19.8,-90.4,21.1,-88.5,21.5,-87,21.5,-87.5,20,-87.8,18.5,-88.3,17.2,-88.5,15.8,-86.5,15.8,-84.2,15.8,-83.3,15,-83.5,13.5,-83.7,11.2,-83.2,10.3,-82.2,9.3,-81,8.9,-79.5,9.5,-78,9.2,-77.6,8.6,-78.1,7.6,-79.5,7.4,-80.4,8,-81.7,8,-83.4,8.4,-85.5,10,-85.8,11.3,-87.5,13,-89.4,13.5,-91.4,14,-93,15.6,-94.6,16.2,-96.3,15.7,-98,16.2,-100,17,-101.8,17.8,-104.5,19.2,-105.6,20.4,-105.3,22.5,-106.5,23.4,-108.5,25.3,-110.5,27.6,-112.3,29.3,-114.6,31.5,-113,29,-111.5,25.8,-110,24,-109.4,23.1,-110.8,24.5,-112.3,26.3,-114.2,27.8,-115.8,30.4,-117.1,32.6,-118.5,34,-120.6,34.6,-121.9,36.6,-122.5,37.8,-123.8,39.8,-124.3,41.5,-124.5,43,-124,46.2,-124.7,48.4,-123,48.5,-124.8,49.8,-127.5,50.8,-128,52,-130.5,54.5,-131.5,55.5,-133.5,57.3,-136,58.3,-139.5,59.6,-143,60,-146.5,60.8,-148.5,60.2,-151.5,59.2,-154,58,-156.5,56.8,-159,55.8,-162,55,-164.5,54.5,-162,55.8,-158.5,57.6,-157,58.8,-161,58.7,-162,59.9,-164.5,60.6,-165.4,62.1,-164.4,63.2,-161,63.6,-161,64.5,-165,64.5],
    [-73,78.2,-66,80.5,-58,82,-45,83,-30,83.5,-22,82,-18,80,-18,77,-21,75,-22,72.5,-24,70.5,-27,68.5,-32,68,-38,65.8,-41,63.5,-43,60,-46,60.8,-49,62,-51,64,-53,66.3,-54,68.5,-51.5,70.5,-54.5,71.5,-56,73.5,-58,75.5,-62,76.5,-68,77],
    [-90,72.5,-84,73.7,-77,72.5,-71,70.8,-67,68.5,-62,66.5,-65,63.2,-70,62.5,-76,64.2,-80,64,-84,66.5,-86,69],
    [-95,76,-90,77.5,-80,77,-75,79,-65,81,-62,82.4,-72,83,-90,82,-98,80,-95,78],
    [-125,72,-118,74.5,-112,74,-102,73,-100,70,-105,68.8,-112,69.5,-118,70.5,-123,71],
    [-59.3,47.6,-56,49.6,-55.5,51.6,-53,49.4,-52.6,47.5,-53.8,46.7,-55.5,47,-57.5,47.5],
    [-85,21.9,-82,22.7,-80,23.1,-77,21.8,-74.2,20.2,-75.6,19.9,-77.7,19.9,-78.5,21.5,-81,21.7,-82.5,21.5,-84.5,21.5],
    [-74.4,18.4,-72.8,19.9,-70,19.7,-68.4,18.6,-70,18.2,-71.7,17.7,-73.5,18.2],
    // South America
    [-77.6,8.4,-76,9.4,-75.5,10.6,-74,11.2,-72,11.9,-71.5,11,-70.2,11.6,-68.5,10.6,-66,10.6,-63,10.7,-61.5,10.1,-60.5,8.6,-58.5,7,-57,6,-55,5.9,-53,5.6,-51.5,4.3,-50.5,2,-50,0.5,-48.5,-1,-46,-1,-44,-2.5,-41.5,-2.9,-39,-3.8,-37,-4.8,-35.3,-5.4,-34.9,-7.5,-35.3,-9.5,-36.8,-11,-38.5,-13,-39,-15,-39,-17.8,-40.5,-20.5,-41.5,-22.5,-44.5,-23.2,-46.5,-24.1,-48.5,-26,-48.7,-28.5,-50.5,-30.5,-52.2,-32.3,-53.5,-34,-55,-34.9,-57,-34.5,-58.4,-34.6,-57.5,-36,-57,-37.5,-58.5,-38.6,-62,-38.9,-62.3,-40.5,-65,-41,-64.5,-42.5,-65,-44.5,-67.5,-46.3,-65.8,-47.8,-67.5,-49.5,-69,-51.5,-68.4,-52.4,-70,-53,-70.5,-54.8,-72.5,-53.8,-74.5,-52.3,-75.3,-49.5,-74.5,-47,-75.5,-45.5,-74,-43.5,-73.8,-41,-73.5,-38,-73.3,-36.5,-72.3,-35,-71.6,-32.6,-71.5,-29.5,-71,-27,-70.5,-25,-70.2,-22,-70.3,-18.5,-71.4,-17.5,-73.5,-16.3,-76,-14.2,-76.5,-12.5,-78,-10.2,-79.4,-7.8,-81,-6,-81.2,-4.5,-80.3,-3.4,-79.8,-2,-80.8,-1,-80,0.8,-78.9,1.8,-78.6,2.7,-77.5,4,-77.3,6,-77.9,7.2],
    // Eurasia (with Arabia, India and Indochina)
    [-9.5,37,-8.9,38.5,-9.5,39.5,-8.9,41.5,-8.8,42.8,-9.3,43.1,-7.7,43.8,-5,43.5,-3.2,43.4,-1.8,43.4,-1.3,44.5,-1.2,46,-2.2,47.1,-4.4,47.8,-4.7,48.4,-3.2,48.8,-1.6,48.7,-1.4,49.6,0.2,49.5,1.5,50.2,1.6,50.9,2.5,51.1,3.6,51.4,4.3,52.1,4.8,53,5.8,53.4,7.1,53.6,8.2,53.6,8.6,54.2,8.6,55.4,8.1,56.5,8.6,57.1,10.5,57.6,10.4,56.6,10.9,56.4,10,55.4,9.6,54.9,10.9,54.4,11.1,54,12.4,54.3,13.6,54.1,14.3,53.9,16,54.3,17.6,54.8,18.7,54.4,19.6,54.4,20.6,54.9,21.2,55.7,21.1,56.9,21.7,57.6,22.6,57.8,23.5,57,24.3,57.3,24.4,58.4,23.5,59.2,25.5,59.6,28,59.5,30.2,59.9,29,60.2,26.6,60.4,25,60.2,22.9,59.9,21.3,60.7,21.5,61.7,21.2,62.7,22.4,63.9,24.5,64.9,25.4,65.4,24.7,65.8,23.5,65.8,22.2,65.6,21.2,64.8,20.3,63.9,18.9,63.3,17.6,62.4,17.1,61.3,17.2,60.6,18.6,60.1,18.9,59.4,17.8,58.8,16.7,57.9,16.4,56.6,15.9,56.1,14.6,56.1,14.2,55.4,12.9,55.4,12.6,56.2,12.5,57.3,11.8,58,11.2,58.9,10.6,59.6,10.3,59.1,9.6,59,8.4,58.3,7,58,5.7,58.6,5.3,59.6,5,60.5,5,61.8,5.8,62.5,7.5,63.3,9.5,63.9,10.6,64.6,12.2,65.9,13.5,67.2,14.8,68.3,16.3,69,18.5,69.9,21.5,70.2,23.5,70.7,25.9,71.1,28.2,71,30,70.2,31.4,69.7,33.2,69.4,36,69,38.5,68.3,40.4,67.7,41.1,66.8,39.5,66.1,36.8,66.3,34.6,66.6,33,66.6,34.8,65.8,34.6,64.5,36.5,64.1,37.8,64.4,39.6,64.6,40.6,64.8,41.8,66,43.9,66.2,44.2,67.9,43.3,68.6,46,68.3,49,67.9,53,68.5,55.5,68.4,58.7,68.9,60.9,69.6,64.5,69.4,67,68.6,68.5,68.2,69.1,69.5,67.5,70.5,66.8,71.8,68.5,73,70,73.5,72.5,72.7,72.7,71.3,74.5,72.2,75.5,71.3,78,72.4,80.5,73.5,82,73.7,86,74.2,87.2,75.1,90,75.6,95,76.1,99.5,76.3,102,77.6,105,77.7,107,76.7,111,76.7,113.5,76,113,74,116,73.6,119,73.1,123,73.5,126.5,73.4,128.5,72.9,130,71.6,132.5,71.8,135,71.6,138,71.5,140,72.4,143,72.6,146,72.3,149.5,72.1,152.5,70.9,157,71,160,70.7,162,69.7,165,69.6,167.8,69.6,170.5,70.1,175,69.8,178.5,69.4,180,68.9,183,68,186,67.3,190.3,66,190,65.6,188,64.6,186,64.4,183,65.2,180,65,178.5,64.7,179,63,178,62.6,175,62,173,61.6,170.4,60,166,60.3,163.5,59.9,162,58.8,163.3,57.7,162.2,56.2,161.7,55.3,160.1,54.2,158.4,53,156.7,51.1,155.6,53.3,155.6,56,156.8,57.4,158.3,58,160.8,59.4,159.8,60.6,154.5,59.5,152,59,149,59.4,146,59.2,143,59.3,141.4,58.6,139,57.3,137,55,135.2,54.6,137.3,53.5,138.5,53.7,140.5,52.5,141.3,50.7,140.4,48.4,138.5,46.9,136.6,45,135.2,43.4,133.2,42.7,131.5,42.8,130.6,42.3,129.7,41,129.7,40.6,128.5,39.5,127.5,39.6,128.4,38.6,129.4,37,129.4,35.7,129,35.1,127.6,34.7,126.4,34.4,126.5,35.6,126.1,36.8,126.7,37.8,125.2,37.7,125,38.6,124.9,39.6,124,39.8,122,40.3,121.2,39.2,122.2,40.6,121,40.9,119.5,40.1,118.5,39.2,117.6,38.7,118.6,37.8,118.9,37.4,119.8,37.1,120.7,37.6,122.5,37.4,122.3,36.9,120.6,36.1,119.4,35.1,119.2,34.4,120.3,34.3,120.8,32.5,121.9,31.7,121.9,30.9,121.5,30.3,122,29.8,121.6,28.7,121.1,28.1,120.3,27.2,119.7,26.3,119.5,25.4,118.6,24.6,117.4,23.8,116.5,22.9,115.2,22.8,114.2,22.3,113.5,22.2,112.5,21.8,111.3,21.5,110.4,21.2,110.2,20.3,109.7,21.4,108.5,21.6,107.4,21.3,106.7,20.6,105.8,19.6,105.6,18.8,106.4,18,107.2,17.1,108.3,16,108.9,15.3,109.3,13.7,109.2,11.8,108.3,10.9,107,10.4,106.6,9.6,105.2,8.6,104.8,9.4,105,10.2,104.4,10.4,103.5,10.6,103,11.6,102.5,12.2,101.5,12.7,100.9,12.6,100.1,13.4,100,12.2,99.5,10.8,99.2,9.2,99.9,9.2,100.4,7.4,101,6.9,101.7,6.6,102.4,6.1,103.3,5,103.4,4.1,103.5,2.8,104.1,1.5,103.5,1.3,102.8,1.9,101.4,2.8,100.6,4.1,100.3,5.4,100.1,6.5,99.5,7.5,98.5,8.2,98.3,9.3,98.6,10.4,98.7,11.7,98.4,13.2,97.9,14.5,97.6,16.4,97.2,16.8,96.3,16.8,95.4,15.8,94.5,16.1,94.2,17.6,94.6,18.6,93.7,19.4,93.1,19.9,92.5,20.7,92.1,21.4,91.8,22.3,90.8,22.1,90.2,21.9,89.1,21.7,88.2,21.6,86.9,21.2,86.6,20.4,85.4,19.7,84.4,18.6,82.4,17,81.3,16.2,80.3,15.9,80.1,15.1,80.3,13.3,79.9,12,79.8,10.3,79.2,10.1,78.3,8.9,77.5,8.1,76.6,8.9,76.2,9.9,75.7,11.3,75.2,12.1,74.7,13.1,74.1,14.8,73.4,16.4,72.9,18.6,72.8,19.9,72.6,21.2,72.7,22,72.1,21.4,70.4,20.8,69.2,22.1,69.6,22.6,70.3,22.9,68.7,23.2,68.3,23.6,67.2,24.6,66.7,25.4,64.5,25.3,61.6,25.2,59.6,25.4,58,25.6,57.3,26.4,56.6,27.2,55.6,26.8,54.6,26.5,53.4,26.9,52.3,27.6,51.2,28.4,50.8,29.2,50.1,30.2,49,30.1,48.4,29.9,47.9,29.9,48.4,28.6,49.3,27.4,50.2,26.6,50.6,25.2,51,24.6,51.6,25.3,51.6,24.3,52.6,24.2,54.1,24.2,55.4,25.2,56.1,26.1,56.4,24.9,57.2,23.9,58.7,23.6,59.8,22.4,59.3,21.4,58.5,20.4,57.8,19.1,57.7,18.9,56.7,18,55.6,17.6,54.1,17,52.6,16.4,52.2,15.6,49.5,14.6,48.7,14.1,47.4,13.6,45.4,13.1,44,12.6,43.5,12.7,43.2,13.3,43,14.5,42.7,15.7,42.4,16.6,41.6,17.5,40.8,18.6,40.2,19.9,39.2,21.3,39,22.6,38.5,23.8,37.5,24.6,37.2,25.3,36.6,26.3,35.9,27.4,35.2,28.1,34.7,29.1,34.9,29.5,34.3,28.1,33.6,28.4,32.6,29.9,32.3,31.2,34.2,31.3,34.6,31.9,34.9,32.8,35.1,33.4,35.5,34.1,35.9,35.2,35.8,35.9,36.1,36.6,35.6,36.6,34.6,36.8,33.7,36.2,32.6,36.1,31.7,36.6,30.6,36.7,29.7,36.1,28.7,36.7,27.5,36.8,27.2,37.4,27.4,37.9,26.4,38.5,26.9,39,26.6,39.5,26.2,40,26.6,40.4,27.6,40.4,28.9,40.4,29.4,40.8,29.1,41.2,30.4,41.2,31.8,41.1,33.5,42,35.2,42,36.9,41.3,38.4,40.9,40.4,41,41.6,41.6,41.6,42.6,40.3,43.1,39,44,37.6,44.7,36.6,45.4,37.5,46.6,38.6,47.1,37.4,47.1,35.3,45.6,35.4,45.1,33.8,44.4,32.5,45.3,33.6,45.8,32.6,46,31.5,46.6,30.8,46.6,30.2,45.9,29.7,45.2,29.1,44.6,28.6,43.8,28,43.3,27.9,42.7,27.9,42,28.6,41.5,28.9,41.2,28.1,41,27.3,40.9,26.7,40.6,26.2,40.6,25.4,40.9,24.3,40.8,23.7,40.7,22.9,40.6,22.6,40.3,22.9,39.4,23.3,39.1,22.9,38.8,23.9,38.3,24,37.7,23.2,37.6,22.9,36.6,22.5,36.4,21.9,36.9,21.6,37.6,21.1,38.3,20.8,39,20.2,39.6,19.8,40.4,19.3,40.7,19.6,41.7,19,42.1,18.5,42.5,17.6,43,16.5,43.5,15.6,44.2,15.2,44.8,14.5,45.3,13.7,45.6,13.1,45.7,12.3,45.3,12.5,44.5,12.4,44,13.6,43.5,14.1,42.6,15.1,41.9,16,41.5,17.1,41,18.4,40.2,18.4,39.8,17.9,40.3,17,40.5,16.5,39.7,17.1,39.2,16.6,38.4,16.1,38,15.6,38,15.9,38.8,15.7,39.5,15.1,40.1,14.4,40.6,14.1,40.8,13.6,41.2,12.6,41.5,12,41.9,11.2,42.4,10.5,42.9,10.2,43.8,9.6,44.1,8.9,44.4,8.2,43.9,7.5,43.8,6.7,43.2,5.8,43.1,4.8,43.4,3.9,43.5,3.1,43,3.2,42.3,3.2,41.9,2.4,41.4,1,41,0.6,40.6,0,39.9,-0.3,39.4,0.2,38.8,-0.6,38.2,-0.8,37.6,-1.4,37.4,-2.1,36.7,-3.6,36.7,-4.4,36.7,-5.2,36.2,-5.6,36,-6,36.4,-6.4,36.8,-7,37.2,-7.5,37.2,-8.9,37],
    [47,44.5,47.5,45.6,49.2,46.4,51,47.1,53,46.8,53.1,45.3,51.3,44.6,51.3,43.2,52.7,42,52.9,41,53.7,40,53.9,38.9,53.9,37.4,51.6,36.8,50.2,37.4,49,38.3,48.9,39.5,49.4,40.2,49.6,40.6,48.6,41.8,47.7,42.7,47.5,43.7],
    // Africa
    [-5.4,35.9,-4.4,35.2,-2.2,35.1,-1,35.7,0.5,36,1.8,36.5,3.2,36.8,5,36.8,6.6,37.1,8.6,36.9,10.2,37.2,11,37,10.5,36.4,11.1,35.3,10.3,34.3,10.1,33.8,11.1,33.2,12.4,32.8,13.6,32.8,15.3,32.3,16.4,31.2,18.4,30.6,19.5,30.4,20.1,31.2,20.1,32.2,21.4,32.8,23,32.6,24.6,32,25.2,31.5,27.2,31.4,28.9,30.9,30.1,31.4,31.1,31.6,32,31.2,32.3,31,32.5,29.9,33.5,27.8,34.1,26.6,34.8,25.4,35.6,23.9,36.4,22.4,36.9,21.2,37.2,19.9,37.6,18.7,38.6,17.9,39.2,16.3,39.8,15.2,40.9,14.4,41.6,13.4,42.6,12.7,43.3,11.9,43.4,11,44.4,10.4,45.6,10.7,47.2,11.1,48.5,11.2,50.1,11.6,51.2,11.9,51.1,10.6,50.8,9.6,50.2,8.4,49.6,7.1,48.9,5.8,48,4.5,46.9,3,45.6,2,44.4,1.4,43.1,0.3,42,-0.9,41.2,-2,40.2,-2.8,39.6,-4.4,39.2,-5.3,38.8,-6.6,39.4,-8,39.7,-9.7,40.4,-10.7,40.5,-12.5,40.6,-14.2,40.1,-16.1,37.8,-17.6,36.5,-18.9,35.2,-20.6,35.4,-22.1,35.5,-23.6,34.6,-24.8,32.9,-25.9,32.8,-27.3,32.6,-28.6,31.3,-29.4,30.3,-30.8,28.7,-32.3,26.9,-33.6,25.6,-34,24.2,-34.1,22.3,-34.1,20.6,-34.4,19.4,-34.6,18.4,-34.1,18.2,-32.8,17.8,-31.3,17.1,-29.6,16.5,-28.6,15.3,-27.2,14.8,-25.4,14.5,-23,14.4,-21.5,13.4,-20.4,12.4,-18.5,11.8,-17.3,11.8,-16,12.2,-14.4,12.9,-12.8,13.7,-11.4,13.3,-9.9,12.9,-8.6,12.3,-6.1,12.3,-5.2,11.9,-4.3,11.1,-3.9,9.9,-2.9,9.3,-1.5,9.3,0.3,9.6,1.5,9.8,2.9,9.5,3.9,8.7,4.4,7.5,4.4,6.1,4.3,5.4,5.6,4.3,6.3,2.6,6.3,1.2,6,-0.5,5.4,-1.9,4.8,-3.3,5.1,-4.9,5.2,-7.6,4.4,-9.3,5.2,-10.8,6.3,-11.6,7,-12.7,7.6,-13.3,8.9,-14.7,10.4,-15.2,11.1,-16.7,12.4,-17.1,13.4,-17.3,14.7,-16.7,15.6,-16.3,17,-16.2,18.6,-16.5,19.5,-16.9,21.3,-16.4,22.7,-15.9,23.8,-14.9,25.1,-14.4,26.2,-13.3,27.5,-12.2,28.2,-10.9,28.9,-9.9,29.7,-9.7,30.9,-9.3,32.3,-8.4,33.4,-6.8,34.1,-6.3,35,-5.9,35.8],
    [49.3,-12,50.5,-15.5,49.5,-17,48,-22,47,-25,45,-25.4,43.6,-23,44.4,-19.5,44,-17,46,-15.7,48,-13.5],
    // Islands of Europe
    [-5.7,50.1,-3,50.6,0,50.8,1.4,51.3,1.7,52.7,0.3,53.5,-0.3,54.5,-1.6,55.6,-2.1,57,-1.8,57.6,-3.8,57.7,-3.1,58.6,-5,58.6,-6.2,57.5,-5.6,56.4,-5.8,55.4,-4.9,54.9,-3.3,54.9,-3.4,54.3,-3,53.4,-4.6,53.3,-4,52.9,-4.4,52.3,-5.3,51.8,-4.2,51.5,-3.2,51.4,-4.2,51.2],
    [-6,52.2,-6.2,53.3,-6,54,-5.6,54.6,-6.2,55.2,-7.5,55.3,-8.4,54.8,-8.5,54.2,-9.9,53.8,-9.2,53.2,-9.9,52,-10.3,51.7,-8.5,51.6,-6.4,52.1],
    [-24,65.5,-21.5,66.4,-18,66.2,-14.5,66.3,-13.5,65,-15,64.3,-18,63.4,-21,63.8,-22.7,64],
    [12.4,38.1,13.7,38.2,15.6,38.3,15.1,36.7,14.3,36.8,12.5,37.6], [8.2,41,9.7,41.1,9.8,40,9.6,39.1,8.4,39,8.4,40], [8.6,42.4,9.4,43,9.6,42.1,9.2,41.4,8.6,41.8],
    [23.5,35.5,25,35.4,26.3,35.2,26.1,34.9,24.5,34.9,23.5,35.2], [32.3,35,33.7,35.4,34.6,35.7,34,34.9,32.9,34.6,32.4,34.8],
    [11,78.5,16,80,23,80.2,27,78.8,22,77.5,16,76.6], [52,71.5,56,74.5,62,76.5,68,76.9,60,75,55,72,53,70.8],
    // Asia and Oceania islands
    [130,31.2,131.5,31.5,132,33.8,135,33.5,136.8,34.3,139,34.8,140.8,35.7,140.6,37,141,38.3,142,39.5,141.5,41.4,140,41.4,139.9,40.5,140,39.5,139.5,38.5,138.5,37.3,137,37,136.5,36,133,35.5,131,34.4,129.8,33.2],
    [140,41.6,141,41.8,143.2,42,145.5,43.3,144.5,44,141.8,45.4,141.5,43.8,140.4,43.2,140,42.4], [142,46,143.5,46.5,143,49,144.5,49,143,53.5,142.5,54.3,142,51.5],
    [79.8,6,81.8,6.3,81.8,8,80.2,9.8,79.8,8], [120.1,23,121,22,121.9,24.8,121.5,25.3,120.2,23.8],
    [120,16,121,18.5,122.3,18.4,122,16,124,13,123.5,12.5,121.5,13.8,120.5,14.5], [122,7,124,6,126.3,6.3,126.5,8.5,125.5,9.7,123.5,8.6],
    [109,1.5,110,-1,110.5,-3,114.5,-3.8,116.3,-3,116,0,117.8,1,119,5,117,6.9,115.5,5,113,3.2,111.5,2.5,109.6,2],
    [95.3,5.6,97.5,5.2,100.5,2,104,-1,106,-3,105.8,-5.8,104.5,-5.8,102,-4,100.3,-1,98.5,2,96,4.5],
    [105.2,-6.8,106,-6,108.5,-6.4,111,-6.4,114.5,-7.7,114.4,-8.7,111,-8.2,108,-7.8,106,-7.4],
    [119.4,-5.6,120.5,-5.5,120.7,-2.8,121.5,-1,123.3,-0.9,124.8,1.5,122,1,120.5,0.5,119.7,-0.6,119,-3.5],
    [131,-1.2,134,-1,138,-1.6,141,-2.6,145,-4.5,146,-6.5,147.8,-8,150,-10.5,147,-10.2,144,-7.8,141,-9.2,138.5,-8.3,137.8,-5.3,135,-4.4,132.5,-3.6,132,-2.6],
    [113.4,-22,114,-26.5,115,-29.5,115,-33.5,116.5,-35,118.5,-34.9,121.5,-33.8,124,-33,126,-32.3,129,-31.6,131.5,-31.5,134,-32.5,136,-34.8,137.8,-33,138,-35.5,140,-37.5,143.5,-38.8,146.3,-39,148,-37.8,150,-37,151.2,-33.8,153,-31,153.5,-28,153,-25,150.8,-22.6,149,-20.5,146.3,-19,145.5,-15,143.6,-14,142.5,-10.8,141.6,-12.6,141.6,-15,140.6,-17.6,139,-17.2,136,-15.5,135.9,-13.2,136.8,-12.2,133,-11.4,130.2,-12.5,129.5,-15,127,-13.8,125,-15,122.3,-17,121,-19.5,117,-20.6],
    [144.7,-40.7,148.3,-40.9,148,-43.2,146,-43.6], [172.7,-34.4,174.5,-36,176,-37.7,178.5,-37.7,177,-39.2,176,-41.2,174.7,-41.3,175,-39.5,173.8,-39.2,174.6,-37.5],
    [172.7,-40.5,174.3,-41.7,173,-43.7,171,-44.8,169,-46.6,166.5,-46,168,-44,171,-42],
    // Antarctica
    [-180,-90,180,-90,180,-70,150,-68,120,-66.5,90,-66.5,60,-67.5,30,-69.5,0,-70.5,-30,-75,-60,-72,-60,-64,-66,-66.5,-75,-72,-100,-73,-130,-75,-160,-78,-180,-78]
  ];

  // ---------- frame lifecycle ----------
  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var C = BRAND.C, FONT = BRAND.FONT, CUR = BRAND.currency, DASH = '–', ELL = '…';
  var RAD = Math.PI / 180, TAU = Math.PI * 2;
  var disposed = false, timers = [], subs = {}, listeners = [], raf = 0, running = false;
  var CURSYM = { GBP: '£', EUR: '€', USD: '$', JPY: '¥', CHF: 'CHF ', SEK: 'kr ', NOK: 'kr ', DKK: 'kr ', AUD: 'A$', CAD: 'C$' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function nz(v) { return isNum(v) ? v : null; }
  function lab(x) { return typeof x === 'string' ? x : (x && typeof x === 'object' && typeof x.name === 'string' ? x.name : ''); }
  function sv(v) { return typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.name === 'string' ? v.name : ''); }
  function timer(fn, ms) { var t = setTimeout(function () { if (!disposed) fn(); }, ms); timers.push(t); return t; }
  function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); listeners.push([el, ev, fn, opt]); }
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function mf(v) { if (!isNum(v)) return DASH; var s = CUR + commas(Math.abs(v).toFixed(0)); return v < 0 ? '(' + s + ')' : s; }
  function mshort(v) { if (!isNum(v)) return DASH; var a = Math.abs(v), s = a >= 1e9 ? (a / 1e9).toFixed(2) + 'bn' : a >= 1e6 ? (a / 1e6).toFixed(1) + 'm' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'k' : a.toFixed(0); return (v < 0 ? '−' : '') + CUR + s; }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 1 : dp) + '%' : DASH; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  // ---------- state ----------
  var S = {
    ent: {}, entInfo: {}, sch: {}, schInfo: {}, wfs: {}, wfc: {}, stages: [], fx: {}, prog: {}, loaded: {}, errors: {},
    measure: 'rev', off: {}, sel: null, hover: null, tour: -1, tourList: [], narrow: false, built: false, hudQ: false
  };
  var MEASURES = [
    { k: 'rev', label: 'Revenue', short: 'Revenue' },
    { k: 'gp', label: 'Gross profit', short: 'Gross profit' },
    { k: 'eb', label: 'Adjusted EBITDA', short: 'EBITDA' },
    { k: 'prog', label: 'Sign-off progress', short: 'Sign-off' }
  ];
  var VIEW0 = { lon: -24, lat: 30, zoom: 1.05 };
  var VW = { lon: 95, lat: 18, zoom: 0.8, vlon: 0, vlat: 0, lastInput: 0, fly: null };
  var P = { cx: 0, cy: 0, R: 100, cl: 1, sl: 0, ca: 1, sa: 0 };

  // ---------- data ----------
  function sub(name, cb, filters) {
    if (!SDK) return null;
    return SDK.subscribeToDataSource(name, {
      dynamicFilters: filters || [],
      onData: function (d) {
        if (disposed || !ready(d)) return;
        delete S.errors[name];
        if (d.totalRowCount > 1000) S.errors[name + '_size'] = name + ' returns ' + d.totalRowCount + ' rows; only the first 1,000 are used.';
        try { cb(d); } catch (e) { S.errors[name] = name + ': ' + String((e && e.message) || e); }
        S.loaded[name] = true;
        rebuild();
      },
      onError: function (e) { if (disposed) return; S.errors[name] = name + ': ' + ((e && e.message) || 'could not load'); queueHud(); }
    });
  }
  function hasLoad(a) { for (var i = 0; i < (a || []).length; i++) { var x = a[i]; if (x && typeof x === 'object' && x.kind === 'loading') return true; } return false; }
  function ready(d) { if (!d || !d.rows) return false; for (var r = 0; r < d.rows.length; r++) { if (hasLoad(d.rows[r].labels) || hasLoad(d.rows[r].values)) return false; } return true; }
  var FV = [{ binding: 'versionList', selection: [BRAND.version] }];
  function onEntP(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[2]); if (!e) return; o[e] = { loop: lab(r.labels[0]) || 'Other', cur: lab(r.labels[1]), country: sv(r.values[0]), method: sv(r.values[1]) }; }); S.entInfo = o; }
  function onSchP(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[1]); if (!s) return; o[s] = { e: lab(r.labels[0]), country: sv(r.values[0]), stream: sv(r.values[1]) }; }); S.schInfo = o; }
  function onEnt(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), l = lab(r.labels[1]); if (!e || !l) return; (o[e] = o[e] || {})[l] = nz(r.values[0]); }); S.ent = o; }
  function onSch(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (!s) return; o[s] = { rev: nz(r.values[0]), gp: nz(r.values[1]) }; }); S.sch = o; }
  function onFX(d) { var o = {}; d.rows.forEach(function (r) { var c = lab(r.labels[0]); if (c) o[c] = nz(r.values[0]); }); S.fx = o; }
  function onStat(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (s) o[s] = nz(r.values[0]); }); S.prog = o; }
  function onWFS(d) { var o = {}, st = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = sv(r.values[0]); st[s] = 1; }); S.wfs = o; S.stages = Object.keys(st).sort(); }
  function onWFC(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = { c: sv(r.values[0]), o: sv(r.values[1]), r: sv(r.values[2]) }; }); S.wfc = o; }
  function startData() {
    subs.dsEntP = sub('dsEntP', onEntP);
    subs.dsSchP = sub('dsSchP', onSchP);
    subs.dsEnt = sub('dsEnt', onEnt, FV);
    subs.dsSch = sub('dsSch', onSch, FV);
    subs.dsFX = sub('dsFX', onFX, FV);
    subs.dsStat = sub('dsStat', onStat);
    subs.dsWFS = sub('dsWFS', onWFS);
    subs.dsWFC = sub('dsWFC', onWFC);
  }

  // ---------- measures ----------
  function pl(e, l) { return (S.ent[e] || {})[l]; }
  function progOf(e) { var w = S.wfs[e] || {}, t = 0, n = 0; Object.keys(w).forEach(function (st) { var p = S.prog[w[st]]; if (isNum(p)) { t += p; n++; } }); return n ? t / n : null; }
  function val(e, k) { return k === 'prog' ? progOf(e) : pl(e, BRAND.lines[k]); }
  function fmtM(v, k) { return k === 'prog' ? pct(v, 0) : mshort(v); }
  function total(k) { var t = 0; Object.keys(S.entInfo).forEach(function (e) { var v = pl(e, BRAND.lines[k]); if (isNum(v)) t += v; }); return t; }

  // ---------- geography ----------
  var GEOK = {}; Object.keys(GEO).forEach(function (k) { GEOK[k.toLowerCase()] = k; });
  function geo(name) {
    var k = String(name || '').replace(/^\s+|\s+$/g, '').toLowerCase(); if (!k) return null;
    if (WORLDWIDE[k]) return { t: 'world' };
    if (REGION[k]) return { t: 'region', lat: REGION[k][0], lon: REGION[k][1], r: REGION[k][2], name: name };
    var nm = GEOK[k] || ALIAS[k]; if (!nm || !GEO[nm]) return null;
    return { t: 'pt', name: nm, lat: GEO[nm][0], lon: GEO[nm][1] };
  }
  function vec(lat, lon) { var a = lat * RAD, b = lon * RAD; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; }
  function ringPts(lat0, lon0, r) {
    var o = [], f0 = lat0 * RAD, rr = r * RAD;
    for (var i = 0; i <= 96; i++) { var th = i / 96 * TAU, f = Math.asin(Math.sin(f0) * Math.cos(rr) + Math.cos(f0) * Math.sin(rr) * Math.cos(th)), l = lon0 * RAD + Math.atan2(Math.sin(th) * Math.sin(rr) * Math.cos(f0), Math.cos(rr) - Math.sin(f0) * Math.sin(f)); o.push(vec(f / RAD, l / RAD)); }
    return o;
  }

  // Land dots: sample an even grid on the sphere and keep points inside the land outlines
  var COARSE = null, FINE = null, fineQ = false, POLYS = null;
  function buildDots(step) {
    var polys = POLYS || (POLYS = LAND.map(function (p) { var b = [1e9, -1e9, 1e9, -1e9]; for (var i = 0; i < p.length; i += 2) { b[0] = Math.min(b[0], p[i]); b[1] = Math.max(b[1], p[i]); b[2] = Math.min(b[2], p[i + 1]); b[3] = Math.max(b[3], p[i + 1]); } return { p: p, b: b }; }));
    function inPoly(x, y, q) {
      if (x < q.b[0] || x > q.b[1] || y < q.b[2] || y > q.b[3]) return false;
      var p = q.p, c = false;
      for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2) { var yi = p[i + 1], yj = p[j + 1]; if ((yi > y) !== (yj > y) && x < (p[j] - p[i]) * (y - yi) / (yj - yi) + p[i]) c = !c; }
      return c;
    }
    function land(lon, lat) { var n = 0; for (var k = 0; k < polys.length; k++) { if (inPoly(lon, lat, polys[k]) || inPoly(lon + 360, lat, polys[k])) n++; } return (n & 1) === 1; }
    var pts = [], row = 0;
    for (var lat = -82; lat <= 83; lat += step, row++) {
      var ls = step / Math.max(Math.cos(lat * RAD), 0.1), off = (row & 1) ? ls / 2 : 0;
      for (var lon = -180 + off; lon < 180; lon += ls) if (land(lon, lat)) pts.push(lat, lon);
    }
    // group the dots into 10-degree tiles so a zoomed-in frame only touches the tiles in view
    var n = pts.length / 2, NT = 18 * 36, cnt = new Int32Array(NT + 1), tileOf = new Int32Array(n);
    for (var a = 0; a < n; a++) { var tl = Math.min(17, Math.floor((pts[a * 2] + 90) / 10)) * 36 + Math.min(35, Math.floor((pts[a * 2 + 1] + 180) / 10)); tileOf[a] = tl; cnt[tl + 1]++; }
    for (var c = 0; c < NT; c++) cnt[c + 1] += cnt[c];
    var fill = cnt.slice(0, NT), d = new Float32Array(n * 3), tc = new Float32Array(NT * 3);
    for (var i = 0; i < n; i++) { var v = vec(pts[i * 2], pts[i * 2 + 1]), k = fill[tileOf[i]]++; d[k * 3] = v[0]; d[k * 3 + 1] = v[1]; d[k * 3 + 2] = v[2]; }
    for (var q = 0; q < NT; q++) { var cv0 = vec(Math.floor(q / 36) * 10 - 85, (q % 36) * 10 - 175); tc[q * 3] = cv0[0]; tc[q * 3 + 1] = cv0[1]; tc[q * 3 + 2] = cv0[2]; }
    var set = { d: d, n: n, t: new Uint8Array(n), step: step, off: cnt, tc: tc, nt: NT }; tintSet(set); return set;
  }
  function buildFine() { if (FINE || disposed) return; FINE = buildDots(0.5); }
  var GRAT = [];
  function buildGrat() {
    GRAT = [];
    for (var lo = -180; lo < 180; lo += 30) { var m = []; for (var la = -85; la <= 85; la += 5) m.push(vec(la, lo)); GRAT.push(m); }
    for (var la2 = -60; la2 <= 60; la2 += 30) { var q = []; for (var lo2 = -180; lo2 <= 180; lo2 += 5) q.push(vec(la2, lo2)); GRAT.push(q); }
  }
  var STARS = [];
  function buildStars() { var s = 7; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; } for (var i = 0; i < 240; i++) STARS.push([rnd(), rnd(), rnd() * 1.2 + 0.3, rnd() * TAU]); }

  // ---------- the world model built from the data ----------
  var BIZ = [], CTRY = {}, HUB = null, PINS = [], RINGS = [], ORBIT = [], UNMAPPED = [], LOOPS = [], LOOPCOL = {}, ARCS = [];
  function coreReady() { return S.loaded.dsEntP && S.loaded.dsEnt; }
  function rebuild() {
    if (!coreReady()) { queueHud(); return; }
    var lt = {};
    Object.keys(S.entInfo).forEach(function (e) { var L = S.entInfo[e].loop; lt[L] = (lt[L] || 0) + Math.max(0, val(e, 'rev') || 0); });
    LOOPS = Object.keys(lt).sort(function (a, b) { return lt[b] - lt[a] || a.localeCompare(b); });
    LOOPCOL = {}; LOOPS.forEach(function (L, i) { LOOPCOL[L] = BRAND.series[i % BRAND.series.length]; });
    BIZ = []; CTRY = {}; UNMAPPED = []; PINS = []; RINGS = []; ORBIT = []; ARCS = [];
    Object.keys(S.entInfo).forEach(function (e) {
      var inf = S.entInfo[e], g = geo(inf.country);
      if (!g || g.t === 'world') { UNMAPPED.push(e + (inf.country ? ' (' + inf.country + ')' : '')); return; }
      var key = g.name || inf.country, c = CTRY[key] || (CTRY[key] = { name: key, lat: g.lat, lon: g.lon, biz: [], sch: [], rr: 0 });
      var b = { e: e, loop: inf.loop, col: LOOPCOL[inf.loop] || C.cloud, ctry: c, lat: g.lat, lon: g.lon, h: 0, ht: 0 };
      c.biz.push(b); BIZ.push(b);
    });
    Object.keys(CTRY).forEach(function (k) {
      var c = CTRY[k], n = c.biz.length;
      c.biz.sort(function (a, b) { return (val(b.e, 'rev') || 0) - (val(a.e, 'rev') || 0) || a.e.localeCompare(b.e); });
      c.rr = n > 1 ? 0.9 + 0.35 * n : 0;
      c.biz.forEach(function (b, i) { var a = -Math.PI / 2 + i * TAU / n; b.lat = c.lat + c.rr * Math.sin(a); b.lon = c.lon + c.rr * Math.cos(a) / Math.cos(c.lat * RAD); b.v = vec(b.lat, b.lon); });
      c.v = vec(c.lat, c.lon);
    });
    HUB = null;
    Object.keys(CTRY).forEach(function (k) { var c = CTRY[k]; if (!HUB || c.biz.length > HUB.biz.length) HUB = c; });
    Object.keys(S.schInfo).forEach(function (s) {
      var inf = S.schInfo[s], g = geo(inf.country), owner = S.entInfo[inf.e] || {};
      var x = { s: s, e: inf.e, stream: inf.stream, country: inf.country, loop: owner.loop, col: LOOPCOL[owner.loop] || C.cloud };
      if (!g) { UNMAPPED.push(s + ' (' + (inf.country || 'no country') + ')'); return; }
      if (g.t === 'world') { ORBIT.push(x); return; }
      if (g.t === 'region') { x.lat = g.lat; x.lon = g.lon; x.r = g.r; x.ring = ringPts(g.lat, g.lon, g.r); x.top = vec(g.lat + g.r, g.lon); RINGS.push(x); return; }
      var c = CTRY[g.name] || (CTRY[g.name] = { name: g.name, lat: g.lat, lon: g.lon, biz: [], sch: [], rr: 0, v: vec(g.lat, g.lon) });
      c.sch.push(x); x.ctry = c; PINS.push(x);
    });
    Object.keys(CTRY).forEach(function (k) {
      var c = CTRY[k], n = c.sch.length, rr = c.biz.length ? c.rr + 1.25 : (n > 1 ? 0.8 : 0);
      c.sch.forEach(function (x, i) { var a = Math.PI / 5 + i * TAU / Math.max(n, 1); x.lat = c.lat + rr * Math.sin(a); x.lon = c.lon + rr * Math.cos(a) / Math.cos(c.lat * RAD); x.v = vec(x.lat, x.lon); });
    });
    if (HUB) BIZ.forEach(function (b) {
      if (b.ctry === HUB) return;
      var A = HUB.v, B = b.v, d = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], om = Math.acos(clamp(d, -1, 1)), sn = Math.sin(om) || 1, pts = [];
      for (var i = 0; i <= 48; i++) { var t = i / 48, k1 = Math.sin((1 - t) * om) / sn, k2 = Math.sin(t * om) / sn, s = 1 + 0.004 + Math.sin(Math.PI * t) * Math.min(0.22, 0.05 + om * 0.28); pts.push([(A[0] * k1 + B[0] * k2) * s, (A[1] * k1 + B[1] * k2) * s, (A[2] * k1 + B[2] * k2) * s]); }
      ARCS.push({ b: b, pts: pts });
    });
    tintDots();
    setHeights();
    fitView();
    if (!S.built) { S.built = true; intro(); }
    queueHud();
  }
  function tintSet(set) {
    if (!set) return;
    var cs = Object.keys(CTRY).map(function (k) { var c = CTRY[k]; return [c.v, Math.cos((2.6 + c.rr) * RAD)]; }), D = set.d;
    for (var i = 0; i < set.n; i++) {
      var x = D[i * 3], y = D[i * 3 + 1], z = D[i * 3 + 2], t = 0;
      for (var j = 0; j < cs.length; j++) { var v = cs[j][0]; if (x * v[0] + y * v[1] + z * v[2] > cs[j][1]) { t = 1; break; } }
      set.t[i] = t;
    }
  }
  function tintDots() { tintSet(COARSE); tintSet(FINE); }
  function maxAbs(k) { var m = 0; BIZ.forEach(function (b) { var v = val(b.e, k); if (isNum(v)) m = Math.max(m, Math.abs(v)); }); return m || 1; }
  function setHeights() {
    var k = S.measure, m = maxAbs(k);
    BIZ.forEach(function (b) { var v = val(b.e, k); b.ht = isNum(v) && v !== 0 ? Math.max(0.014, (k === 'prog' ? 0.3 * v : 0.5 * Math.abs(v) / m)) : 0.006; b.neg = isNum(v) && v < 0; });
  }
  function vis(b) { return !S.off[b.loop]; }

  // ---------- camera ----------
  function setRot() { var a = VW.lon * RAD, b = VW.lat * RAD; P.cl = Math.cos(a); P.sl = Math.sin(a); P.ca = Math.cos(b); P.sa = Math.sin(b); }
  var T3 = [0, 0, 0];
  function rot(x, y, z) { var x1 = x * P.cl - z * P.sl, z1 = x * P.sl + z * P.cl; T3[0] = x1; T3[1] = y * P.ca - z1 * P.sa; T3[2] = y * P.sa + z1 * P.ca; return T3; }
  function flyTo(lon, lat, zoom, dur) {
    var dl = ((lon - VW.lon) % 360 + 540) % 360 - 180;
    VW.fly = { t0: now(), dur: dur || 1400, f: { lon: VW.lon, lat: VW.lat, zoom: VW.zoom }, t: { lon: VW.lon + dl, lat: clamp(lat, -70, 70), zoom: clamp(zoom, 0.6, 7) } };
    VW.vlon = VW.vlat = 0; start();
  }
  function fitView() {
    if (!BIZ.length) return;
    var sx = 0, sy = 0, sz = 0;
    BIZ.forEach(function (b) { var w = Math.max(1, Math.abs(val(b.e, 'rev') || 0)); sx += b.v[0] * w; sy += b.v[1] * w; sz += b.v[2] * w; });
    var n = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1, lat = Math.asin(sy / n) / RAD, lon = Math.atan2(sx / n, sz / n) / RAD, c = vec(lat, lon), far = 0;
    BIZ.forEach(function (b) { far = Math.max(far, Math.acos(clamp(b.v[0] * c[0] + b.v[1] * c[1] + b.v[2] * c[2], -1, 1))); });
    VIEW0.lon = lon; VIEW0.lat = clamp(lat - 22, -50, 50); VIEW0.zoom = clamp(1.4 / Math.max(Math.sin(Math.min(far + 0.1, Math.PI / 2)), 0.4), 1.15, 2.4);
  }
  function intro() { VW.lastInput = now(); flyTo(VIEW0.lon, VIEW0.lat, VIEW0.zoom, 2600); }
  function flyToBiz(b) { flyTo(b.lon, b.lat - 16, Math.max(2.3, Math.min(VW.zoom, 3.2)), 1500); }

  // ---------- DOM ----------
  root.innerHTML = '<div class="w-app" id="wApp"><canvas id="wcv"></canvas><div id="whud"></div><div id="wtip" class="w-tip"></div></div>';
  var cv = $('wcv'), ctx = cv.getContext('2d'), dpr = 1, CW = 0, CH = 0, bgG = null;
  function resize() {
    var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== CW || h !== CH || cv.width !== Math.round(w * dpr)) {
      CW = w; CH = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      bgG = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bgG.addColorStop(0, '#0A3550'); bgG.addColorStop(0.55, '#04192A'); bgG.addColorStop(1, C.space);
      var nar = w < 700; if (nar !== S.narrow) { S.narrow = nar; queueHud(); }
    }
    return true;
  }

  // ---------- animation ----------
  var last = 0;
  function frame(ts) {
    raf = 0; if (disposed || !running) return;
    if (resize()) { step(ts); draw(ts); }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || disposed) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function step(ts) {
    var dt = last ? Math.min(64, ts - last) : 16; last = ts;
    if (VW.fly) {
      var f = VW.fly, t = clamp((now() - f.t0) / f.dur, 0, 1), e = ease(t);
      VW.lon = f.f.lon + (f.t.lon - f.f.lon) * e; VW.lat = f.f.lat + (f.t.lat - f.f.lat) * e;
      var zf = Math.log(f.f.zoom), zt = Math.log(f.t.zoom), arc = Math.sin(Math.PI * t) * (Math.abs(f.t.lon - f.f.lon) > 40 ? 0.35 : 0);
      VW.zoom = Math.exp(zf + (zt - zf) * e - arc);
      if (t >= 1) VW.fly = null;
    } else if (!drag.on) {
      if (Math.abs(VW.vlon) > 0.001 || Math.abs(VW.vlat) > 0.001) { VW.lon += VW.vlon * dt / 16; VW.lat = clamp(VW.lat + VW.vlat * dt / 16, -75, 75); VW.vlon *= 0.93; VW.vlat *= 0.93; }
      else if (now() - VW.lastInput > 6000 && S.tour < 0 && !S.sel) VW.lon += 0.0035 * dt;
    }
    for (var i = 0; i < BIZ.length; i++) { var b = BIZ[i]; b.h += (b.ht - b.h) * Math.min(1, dt / 220); }
  }

  // ---------- drawing ----------
  var COLS = [], CPOS = [];
  var LX = -0.42, LY = 0.52, LZ = 0.74;
  function draw(ts) {
    var w = CW, h = CH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bgG; ctx.fillRect(0, 0, w, h);
    drawStars(w, h, ts);
    if (S.narrow) { drawFlat(w, h); return; }
    var panelW = S.sel ? Math.min(420, w * 0.36) + 24 : 0, top = 132;
    P.cx = (w - panelW) / 2; P.cy = top + (h - top - 40) / 2;
    P.R = Math.min(w - panelW - 80, h - top - 60) * 0.44 * VW.zoom;
    setRot();
    prepCols();
    drawOrbit(ts, false);
    for (var i = 0; i < COLS.length; i++) if (!COLS[i].front) drawCol(COLS[i]);
    drawGlobe(); drawGrat(); drawDots(); drawRings(ts); drawArcs(ts); drawHub(ts); drawPins();
    for (var j = 0; j < COLS.length; j++) if (COLS[j].front) drawCol(COLS[j]);
    drawOrbit(ts, true);
    drawLabels();
  }
  function drawStars(w, h, ts) {
    var sh = ((VW.lon / 360) % 1 + 1) % 1;
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i], x = ((s[0] - sh * 0.15) % 1 + 1) % 1 * w, y = s[1] * h, a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(ts * 0.0012 + s[3]));
      ctx.fillStyle = 'rgba(200,230,255,' + a.toFixed(3) + ')'; ctx.fillRect(x, y, s[2], s[2]);
    }
  }
  function proj(v, s) { var r = rot(v[0] * s, v[1] * s, v[2] * s); return { x: P.cx + r[0] * P.R, y: P.cy - r[1] * P.R, z: r[2], rr: Math.sqrt(r[0] * r[0] + r[1] * r[1]) }; }
  function visible3(r) { return r.z > 0 || r.rr > 1.001; }
  function drawGlobe() {
    var R = P.R, cx = P.cx, cy = P.cy;
    var g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
    g.addColorStop(0, 'rgba(19,208,200,0.32)'); g.addColorStop(0.35, 'rgba(76,141,255,0.12)'); g.addColorStop(1, 'rgba(76,141,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, TAU); ctx.fill();
    var s = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx, cy, R);
    s.addColorStop(0, '#11506F'); s.addColorStop(0.55, '#06304A'); s.addColorStop(1, '#021624');
    ctx.fillStyle = s; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(143,211,228,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  }
  function drawGrat() {
    ctx.strokeStyle = 'rgba(143,211,228,0.07)'; ctx.lineWidth = 1;
    for (var i = 0; i < GRAT.length; i++) {
      var g = GRAT[i], pen = false; ctx.beginPath();
      for (var j = 0; j < g.length; j++) { var r = rot(g[j][0], g[j][1], g[j][2]); if (r[2] > 0) { var x = P.cx + r[0] * P.R, y = P.cy - r[1] * P.R; if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; } else pen = false; }
      ctx.stroke();
    }
  }
  var BUCK = 8, BX = [], BY = [], TX = [], TY = [];
  for (var bq = 0; bq < BUCK; bq++) { BX.push([]); BY.push([]); TX.push([]); TY.push([]); }
  function drawDots() {
    if (!COARSE) return;
    if (P.R > 560 && !FINE && !fineQ) { fineQ = true; timer(buildFine, 0); }
    var set = P.R > 640 && FINE ? FINE : COARSE, DOT = set.d, DOTN = set.n, DOTT = set.t;
    for (var q = 0; q < BUCK; q++) { BX[q].length = BY[q].length = TX[q].length = TY[q].length = 0; }
    var R = P.R, cx = P.cx, cy = P.cy, cl = P.cl, sl = P.sl, ca = P.ca, sa = P.sa, W = CW, H = CH;
    var ds = set === FINE ? clamp(R / 520, 1.2, 3.4) : clamp(R / 230, 1.1, 3.6);
    var TC = set.tc, OFF = set.off, tr = R * 0.2 + 8;
    for (var tq = 0; tq < set.nt; tq++) {
      if (OFF[tq + 1] === OFF[tq]) continue;
      var cx0 = TC[tq * 3], cy0 = TC[tq * 3 + 1], cz0 = TC[tq * 3 + 2], cx1 = cx0 * cl - cz0 * sl, cz1 = cx0 * sl + cz0 * cl, cy2 = cy0 * ca - cz1 * sa, cz2 = cy0 * sa + cz1 * ca;
      if (cz2 < -0.2) continue;
      var tsx = cx + cx1 * R, tsy = cy - cy2 * R; if (tsx < -tr || tsy < -tr || tsx > W + tr || tsy > H + tr) continue;
    for (var i = OFF[tq]; i < OFF[tq + 1]; i++) {
      var x = DOT[i * 3], y = DOT[i * 3 + 1], z = DOT[i * 3 + 2];
      var x1 = x * cl - z * sl, z1 = x * sl + z * cl, y2 = y * ca - z1 * sa, z2 = y * sa + z1 * ca;
      if (z2 < 0.02) continue;
      var sx = cx + x1 * R, sy = cy - y2 * R; if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
      var sh = Math.max(0, x1 * LX + y2 * LY + z2 * LZ), lum = (0.32 + 0.68 * sh) * Math.min(1, 0.3 + z2 * 1.4), lvl = Math.min(BUCK - 1, Math.floor(lum * BUCK));
      if (DOTT[i]) { TX[lvl].push(sx); TY[lvl].push(sy); } else { BX[lvl].push(sx); BY[lvl].push(sy); }
    }
    }
    for (var l = 0; l < BUCK; l++) {
      var a = 0.12 + 0.88 * (l + 1) / BUCK;
      if (BX[l].length) { ctx.fillStyle = rgba(C.land, (a * 0.62).toFixed(3)); var bx = BX[l], by = BY[l]; for (var k = 0; k < bx.length; k++) ctx.fillRect(bx[k] - ds / 2, by[k] - ds / 2, ds, ds); }
      if (TX[l].length) { ctx.fillStyle = rgba('#5CFFB0', (a * 0.9).toFixed(3)); var tx = TX[l], ty = TY[l]; for (var m = 0; m < tx.length; m++) ctx.fillRect(tx[m] - ds * 0.6, ty[m] - ds * 0.6, ds * 1.2, ds * 1.2); }
    }
  }
  function strokeVisible(pts, s) {
    var pen = false; ctx.beginPath();
    for (var i = 0; i < pts.length; i++) { var p = proj(pts[i], s); if (visible3(p)) { if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; } else pen = false; }
    ctx.stroke();
  }
  function drawRings(ts) {
    for (var i = 0; i < RINGS.length; i++) {
      var x = RINGS[i]; if (S.off[x.loop]) continue;
      ctx.setLineDash([4, 6]); ctx.lineDashOffset = -ts * 0.01; ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(x.col, 0.75);
      var pen = false; ctx.beginPath();
      for (var j = 0; j < x.ring.length; j++) { var r = rot(x.ring[j][0] * 1.003, x.ring[j][1] * 1.003, x.ring[j][2] * 1.003); if (r[2] > 0.02) { var sx = P.cx + r[0] * P.R, sy = P.cy - r[1] * P.R; if (pen) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); pen = true; } else pen = false; }
      ctx.stroke(); ctx.setLineDash([]);
      var t = proj(x.top, 1.01); x.sx = t.x; x.sy = t.y; x.front = t.z > 0.1;
      if (x.front) { ctx.fillStyle = x.col; ctx.beginPath(); ctx.arc(t.x, t.y, 3.5, 0, TAU); ctx.fill(); }
    }
  }
  function drawArcs(ts) {
    ctx.lineWidth = 1.5; ctx.setLineDash([5, 9]); ctx.lineDashOffset = -ts * 0.03;
    for (var i = 0; i < ARCS.length; i++) { var a = ARCS[i]; if (!vis(a.b)) continue; ctx.strokeStyle = rgba(a.b.col, S.sel && S.sel !== a.b.e ? 0.25 : 0.75); strokeVisible(a.pts, 1); }
    ctx.setLineDash([]);
  }
  function drawHub(ts) {
    if (!HUB) return; var p = proj(HUB.v, 1.002); if (p.z < 0.05) return;
    for (var k = 0; k < 2; k++) {
      var t = ((ts * 0.0005) + k * 0.5) % 1, r = (6 + t * 28) * Math.sqrt(clamp(P.R / 260, 0.6, 3)) * (0.4 + 0.6 * p.z);
      ctx.strokeStyle = 'rgba(92,255,176,' + (0.6 * (1 - t)).toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * Math.max(0.25, p.z), 0, 0, TAU); ctx.stroke();
    }
  }
  function drawPins() {
    var zoomed = P.R > 820;
    for (var i = 0; i < PINS.length; i++) {
      var x = PINS[i]; if (S.off[x.loop]) { x.front = false; continue; }
      var b = proj(x.v, 1.0), t = proj(x.v, 1.028); x.sx = t.x; x.sy = t.y; x.front = b.z > 0.05;
      if (!x.front) continue;
      ctx.strokeStyle = rgba(x.col, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      ctx.fillStyle = x.col; ctx.beginPath(); ctx.arc(t.x, t.y, zoomed ? 4.5 : 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(t.x, t.y, zoomed ? 1.6 : 1.1, 0, TAU); ctx.fill();
    }
  }
  function prepCols() {
    COLS = [];
    var wpx = clamp(P.R * 0.022, 5, 26);
    for (var i = 0; i < BIZ.length; i++) {
      var b = BIZ[i]; if (!vis(b) || !b.v) continue;
      var p0 = proj(b.v, 1.0), p1 = proj(b.v, 1 + b.h);
      var c = { b: b, bx: p0.x, by: p0.y, tx: p1.x, ty: p1.y, z: p0.z, front: p0.z > 0, w: wpx * (0.55 + 0.45 * Math.max(0, p0.z)), topVis: visible3(p1) };
      if (!c.front && !c.topVis) continue;
      COLS.push(c);
    }
    COLS.sort(function (a, b) { return a.z - b.z; });
  }
  function drawCol(c) {
    var b = c.b, col = b.neg ? C.coral : b.col, dx = c.tx - c.bx, dy = c.ty - c.by, L = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / L * c.w / 2, py = dx / L * c.w / 2;
    var hot = S.hover === b.e || S.sel === b.e, dim = S.sel && !hot ? 0.45 : 1;
    if (c.front) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(c.bx, c.by, c.w * 0.8, c.w * 0.8 * Math.max(0.3, c.z), 0, 0, TAU); ctx.fill(); }
    var g = ctx.createLinearGradient(c.bx, c.by, c.tx, c.ty);
    g.addColorStop(0, rgba(col, 0.35 * dim)); g.addColorStop(1, rgba(col, (hot ? 1 : 0.92) * dim));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c.bx + px, c.by + py); ctx.lineTo(c.tx + px, c.ty + py); ctx.lineTo(c.tx - px, c.ty - py); ctx.lineTo(c.bx - px, c.by - py); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(2,14,24,' + (0.3 * dim).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(c.bx, c.by); ctx.lineTo(c.tx, c.ty); ctx.lineTo(c.tx - px, c.ty - py); ctx.lineTo(c.bx - px, c.by - py); ctx.closePath(); ctx.fill();
    var gl = ctx.createRadialGradient(c.tx, c.ty, 0, c.tx, c.ty, c.w * 2.2);
    gl.addColorStop(0, rgba(col, 0.55 * dim)); gl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(c.tx, c.ty, c.w * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(col, dim); ctx.beginPath(); ctx.arc(c.tx, c.ty, c.w / 2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * dim).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(c.tx - c.w * 0.12, c.ty - c.w * 0.12, c.w * 0.2, 0, TAU); ctx.fill();
    if (hot) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c.tx, c.ty, c.w / 2 + 3, 0, TAU); ctx.stroke(); }
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
  function drawLabels() {
    var placed = [], k = S.measure, zoomed = P.R > 820;
    function fits(r) { for (var i = 0; i < placed.length; i++) { var q = placed[i]; if (r[0] < q[0] + q[2] && r[0] + r[2] > q[0] && r[1] < q[1] + q[3] && r[1] + r[3] > q[1]) return false; } return true; }
    var list = COLS.filter(function (c) { return c.front && c.z > 0.22; }).sort(function (a, b) {
      var ha = (S.sel === a.b.e || S.hover === a.b.e) ? 1 : 0, hb = (S.sel === b.b.e || S.hover === b.b.e) ? 1 : 0;
      return hb - ha || Math.abs(val(b.b.e, k) || 0) - Math.abs(val(a.b.e, k) || 0);
    });
    for (var i = 0; i < list.length; i++) {
      var c = list[i], b = c.b, v = val(b.e, k), name = b.e, vt = fmtM(v, k);
      ctx.font = '600 12px ' + FONT; var w1 = ctx.measureText(name).width; ctx.font = '700 12px ' + FONT; var w2 = ctx.measureText(vt).width;
      var W = w1 + w2 + 26, H = 24, x = c.tx - W / 2, y = c.ty - c.w / 2 - H - 8;
      var force = S.sel === b.e || S.hover === b.e;
      if (!force && (!isNum(v) || v === 0)) continue;
      if (!force && !fits([x - 2, y - 2, W + 4, H + 4])) continue;
      placed.push([x - 2, y - 2, W + 4, H + 4]);
      ctx.fillStyle = 'rgba(3,22,36,0.86)'; rrect(x, y, W, H, 12); ctx.fill();
      ctx.strokeStyle = rgba(b.neg ? C.coral : b.col, force ? 1 : 0.55); ctx.lineWidth = 1; rrect(x, y, W, H, 12); ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = '600 12px ' + FONT; ctx.textBaseline = 'middle'; ctx.fillText(name, x + 10, y + H / 2 + 0.5);
      ctx.fillStyle = b.neg ? C.coral : b.col; ctx.font = '700 12px ' + FONT; ctx.fillText(vt, x + 16 + w1, y + H / 2 + 0.5);
    }
    if (zoomed) {
      ctx.font = '500 11px ' + FONT; ctx.textBaseline = 'middle';
      PINS.forEach(function (x) { if (!x.front) return; var w = ctx.measureText(x.s).width, r = [x.sx + 8, x.sy - 8, w + 10, 16]; if (!fits(r)) return; placed.push(r); ctx.fillStyle = 'rgba(3,22,36,0.7)'; rrect(r[0], r[1], r[2], r[3], 8); ctx.fill(); ctx.fillStyle = C.mut; ctx.fillText(x.s, r[0] + 5, x.sy); });
    }
    RINGS.forEach(function (x) { if (!x.front || S.off[x.loop]) return; ctx.font = '600 11px ' + FONT; var t = x.country + ' · ' + x.s, w = ctx.measureText(t).width, r = [x.sx - w / 2 - 6, x.sy - 24, w + 12, 18]; if (!fits(r)) return; placed.push(r); ctx.fillStyle = 'rgba(3,22,36,0.78)'; rrect(r[0], r[1], r[2], r[3], 9); ctx.fill(); ctx.fillStyle = x.col; ctx.textBaseline = 'middle'; ctx.fillText(t, r[0] + 6, r[1] + 9.5); });
  }
  var ORB_TILT = 0.42;
  function orbitPt(t, s) { var x = Math.cos(t), y = Math.sin(t) * Math.sin(ORB_TILT), z = Math.sin(t) * Math.cos(ORB_TILT); return [x * s, y * s, z * s]; }
  function drawOrbit(ts, front) {
    var list = ORBIT.filter(function (x) { return !S.off[x.loop]; }); if (!list.length) return;
    var s = 1.3, col = list[0].col;
    ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(col, front ? 0.55 : 0.2); ctx.setLineDash([2, 6]);
    var pen = false; ctx.beginPath();
    for (var i = 0; i <= 160; i++) { var p = orbitPt(i / 160 * TAU, s), r = rot(p[0], p[1], p[2]), ok = front ? r[2] >= 0 : r[2] < 0; if (ok) { var x = P.cx + r[0] * P.R, y = P.cy - r[1] * P.R; if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; } else pen = false; }
    ctx.stroke(); ctx.setLineDash([]);
    list.forEach(function (x, i) {
      var p = orbitPt(ts * 0.00018 + i * TAU / list.length, s), r = rot(p[0], p[1], p[2]); if ((r[2] >= 0) !== front) return;
      var sx = P.cx + r[0] * P.R, sy = P.cy - r[1] * P.R; x.sx = sx; x.sy = sy; x.front = r[2] >= 0;
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14); g.addColorStop(0, rgba(x.col, 0.7)); g.addColorStop(1, rgba(x.col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, TAU); ctx.fill();
      if (front) { ctx.font = '600 11px ' + FONT; ctx.textBaseline = 'middle'; var t = 'Worldwide · ' + x.s, w = ctx.measureText(t).width; ctx.fillStyle = 'rgba(3,22,36,0.78)'; rrect(sx + 10, sy - 9, w + 12, 18, 9); ctx.fill(); ctx.fillStyle = x.col; ctx.fillText(t, sx + 16, sy + 0.5); }
    });
  }
  // Narrow screens: flat dot map with bubbles; the list sits under it
  var FLAT = [];
  function drawFlat(w, h) {
    var H = Math.min(h * 0.5, w / 2), W = H * 2, ox = (w - W) / 2, oy = 70;
    function xy(lat, lon) { return [ox + (lon + 180) / 360 * W, oy + (90 - lat) / 180 * H]; }
    ctx.fillStyle = 'rgba(143,211,228,0.35)';
    if (COARSE) for (var i = 0; i < COARSE.n; i++) { var D = COARSE.d, y = D[i * 3 + 1], lat = Math.asin(y) / RAD, lon = Math.atan2(D[i * 3], D[i * 3 + 2]) / RAD, p = xy(lat, lon); ctx.fillStyle = COARSE.t[i] ? 'rgba(92,255,176,0.8)' : 'rgba(143,211,228,0.32)'; ctx.fillRect(p[0], p[1], 1.4, 1.4); }
    var k = S.measure, m = maxAbs(k); FLAT = [];
    BIZ.forEach(function (b) { if (!vis(b)) return; var v = val(b.e, k), p = xy(b.lat, b.lon), r = 3 + 16 * Math.sqrt(Math.abs(v || 0) / m); ctx.fillStyle = rgba(b.neg ? C.coral : b.col, 0.55); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill(); ctx.strokeStyle = b.neg ? C.coral : b.col; ctx.lineWidth = 1.2; ctx.stroke(); FLAT.push({ b: b, x: p[0], y: p[1], r: r }); });
  }

  // ---------- hit testing ----------
  function segDist(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0, x = ax + t * dx - px, y = ay + t * dy - py; return Math.sqrt(x * x + y * y); }
  function hitBiz(mx, my) {
    if (S.narrow) { for (var f = 0; f < FLAT.length; f++) { var q = FLAT[f], dx = q.x - mx, dy = q.y - my; if (dx * dx + dy * dy < (q.r + 4) * (q.r + 4)) return q.b; } return null; }
    var best = null, bz = -9;
    for (var i = 0; i < COLS.length; i++) { var c = COLS[i]; if (!c.front && !c.topVis) continue; var d = segDist(mx, my, c.bx, c.by, c.tx, c.ty); if (d < c.w / 2 + 6 && c.z > bz) { best = c.b; bz = c.z; } }
    return best;
  }
  function hitCountry(mx, my) {
    var best = null, bd = 1e9;
    Object.keys(CTRY).forEach(function (k) { var c = CTRY[k], p = proj(c.v, 1); if (p.z < 0.1) return; var dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy), thr = 30 + (c.rr + 1.2) * RAD * P.R; if (d < thr && d < bd) { bd = d; best = c; } });
    return best;
  }
  function hitRing(mx, my) {
    for (var i = 0; i < RINGS.length; i++) { var x = RINGS[i]; if (x.front && Math.abs(x.sx - mx) < 10 && Math.abs(x.sy - my) < 10) return x; }
    for (var j = 0; j < ORBIT.length; j++) { var o = ORBIT[j]; if (o.front && Math.abs(o.sx - mx) < 12 && Math.abs(o.sy - my) < 12) return o; }
    for (var k = 0; k < PINS.length; k++) { var p = PINS[k]; if (p.front && Math.abs(p.sx - mx) < 7 && Math.abs(p.sy - my) < 7) return p; }
    return null;
  }

  // ---------- pointer, wheel and keys ----------
  var drag = { on: false, id: null, x: 0, y: 0, sx: 0, sy: 0, moved: 0, pts: {}, pinch: 0, z0: 1 };
  function note() { VW.lastInput = now(); }
  function onDown(e) {
    if (e.target !== cv) return; note(); drag.pts[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(drag.pts);
    if (ids.length === 2) { var a = drag.pts[ids[0]], b = drag.pts[ids[1]]; drag.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; drag.z0 = VW.zoom; drag.on = false; return; }
    drag.on = true; drag.x = drag.sx = e.clientX; drag.y = drag.sy = e.clientY; drag.moved = 0; VW.fly = null; VW.vlon = VW.vlat = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  }
  function onMove(e) {
    var r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag.pts[e.pointerId]) drag.pts[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(drag.pts);
    if (ids.length === 2 && drag.pinch) { var a = drag.pts[ids[0]], b = drag.pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); VW.zoom = clamp(drag.z0 * d / drag.pinch, 0.6, 7); note(); return; }
    if (drag.on) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, k = 0.32 / Math.max(0.6, VW.zoom); drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      VW.lon -= dx * k; VW.lat = clamp(VW.lat + dy * k, -75, 75); VW.vlon = -dx * k * 0.9; VW.vlat = dy * k * 0.9; note();
      if (drag.moved > 6 && S.tour >= 0) tourStop();
      hideTip(); return;
    }
    if (e.target !== cv) { if (S.hover) S.hover = null; hideTip(); return; }
    var b = hitBiz(mx, my);
    if (b) { if (S.hover !== b.e) { S.hover = b.e; } showTip(bizTip(b), e); cv.style.cursor = 'pointer'; return; }
    S.hover = null;
    var x = S.narrow ? null : hitRing(mx, my);
    if (x) { showTip(schTip(x), e); cv.style.cursor = 'default'; return; }
    var c = S.narrow ? null : hitCountry(mx, my);
    if (c) { showTip(ctryTip(c), e); cv.style.cursor = 'default'; return; }
    hideTip(); cv.style.cursor = drag.on ? 'grabbing' : 'grab';
  }
  function onUp(e) {
    delete drag.pts[e.pointerId];
    if (Object.keys(drag.pts).length < 2) drag.pinch = 0;
    if (!drag.on) return; drag.on = false;
    if (drag.moved < 6 && e.target === cv) {
      var r = cv.getBoundingClientRect(), b = hitBiz(e.clientX - r.left, e.clientY - r.top);
      if (b) { if (S.tour >= 0) tourStop(); select(b.e); } else if (S.sel) { S.sel = null; queueHud(); }
    }
  }
  // Screen point to [lat, lon] on the globe (null when off the globe)
  function unproj(mx, my) {
    var nx = (mx - P.cx) / P.R, ny = -(my - P.cy) / P.R, q = nx * nx + ny * ny; if (q > 1) return null;
    var z2 = Math.sqrt(1 - q), y = ny * P.ca + z2 * P.sa, z1 = -ny * P.sa + z2 * P.ca, x = nx * P.cl + z1 * P.sl, z = -nx * P.sl + z1 * P.cl;
    return [Math.asin(clamp(y, -1, 1)) / RAD, Math.atan2(x, z) / RAD];
  }
  function zoomAt(mx, my, z1) {
    var z0 = VW.zoom; z1 = clamp(z1, 0.6, 7); VW.fly = null;
    var g = S.narrow ? null : unproj(mx, my);
    if (g && z1 > z0) { var f = 1 - z0 / z1, dl = ((g[1] - VW.lon) % 360 + 540) % 360 - 180; VW.lon += dl * f; VW.lat = clamp(VW.lat + (g[0] - VW.lat) * f, -75, 75); }
    VW.zoom = z1;
  }
  function onWheel(e) { if (e.target !== cv) return; e.preventDefault(); note(); var r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, VW.zoom * Math.exp(-e.deltaY * 0.0014)); }
  function onKey(e) {
    if (e.key === 'Escape') { if (S.tour >= 0) tourStop(); else if (S.sel) { S.sel = null; queueHud(); } return; }
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowLeft') { VW.vlon = -1.6; note(); } else if (e.key === 'ArrowRight') { VW.vlon = 1.6; note(); }
    else if (e.key === 'ArrowUp') { VW.vlat = 1.2; note(); } else if (e.key === 'ArrowDown') { VW.vlat = -1.2; note(); }
    else if (e.key === '+' || e.key === '=') { VW.zoom = clamp(VW.zoom * 1.25, 0.6, 7); note(); } else if (e.key === '-') { VW.zoom = clamp(VW.zoom / 1.25, 0.6, 7); note(); }
  }

  // ---------- tooltips ----------
  var tipEl = $('wtip');
  function showTip(html, e) {
    tipEl.innerHTML = html; tipEl.style.display = 'block';
    var tw = tipEl.offsetWidth, th = tipEl.offsetHeight, x = e.clientX + 16, y = e.clientY + 16;
    if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 16; if (y + th > window.innerHeight - 8) y = e.clientY - th - 16;
    tipEl.style.left = Math.max(8, x) + 'px'; tipEl.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { tipEl.style.display = 'none'; }
  function row(l, v, col) { return '<div class="tr"><span>' + (col ? '<i style="background:' + col + '"></i>' : '') + esc(l) + '</span><b>' + esc(v) + '</b></div>'; }
  function bizTip(b) {
    var k = S.measure, inf = S.entInfo[b.e] || {};
    return '<div class="th"><b>' + esc(b.e) + '</b><span class="tg" style="background:' + rgba(b.col, 0.25) + ';color:' + b.col + '">' + esc(b.loop) + '</span></div><div class="ts">' + esc(inf.country || '') + '</div>' +
      row('Revenue', mshort(val(b.e, 'rev'))) + row('Gross profit', mshort(val(b.e, 'gp'))) + row('Adjusted EBITDA', mshort(val(b.e, 'eb'))) + row('Sign-off', pct(progOf(b.e), 0)) +
      '<div class="tf">Click for the full picture</div>';
  }
  function schTip(x) { var v = S.sch[x.s] || {}; return '<div class="th"><b>' + esc(x.s) + '</b></div><div class="ts">' + esc(x.country) + ' · ' + esc(x.stream || '') + ' · run by ' + esc(x.e) + '</div>' + row('Revenue', mshort(v.rev)) + row('Gross profit', mshort(v.gp)); }
  function ctryTip(c) {
    var rv = 0, eb = 0, h = '<div class="th"><b>' + esc(c.name) + '</b></div><div class="ts">' + c.biz.length + ' business' + (c.biz.length === 1 ? '' : 'es') + ' · ' + c.sch.length + ' scheme' + (c.sch.length === 1 ? '' : 's') + '</div>';
    c.biz.forEach(function (b) { var v = val(b.e, S.measure); rv += val(b.e, 'rev') || 0; eb += val(b.e, 'eb') || 0; h += row(b.e, fmtM(v, S.measure), b.col); });
    c.sch.forEach(function (x) { h += row(x.s, mshort((S.sch[x.s] || {}).rev), x.col); });
    if (c.biz.length) h += '<div class="tt">' + row('Revenue, all businesses', mshort(rv)) + row('Adjusted EBITDA', mshort(eb)) + '</div>';
    return h;
  }

  // ---------- selection and tour ----------
  function bizOf(e) { for (var i = 0; i < BIZ.length; i++) if (BIZ[i].e === e) return BIZ[i]; return null; }
  function select(e, fromTour) { var b = bizOf(e); S.sel = e; note(); if (b) flyToBiz(b); queueHud(); if (!fromTour) hideTip(); }
  function caption(e) {
    var b = bizOf(e); if (!b) return '';
    var inf = S.entInfo[e] || {}, rev = val(e, 'rev'), eb = val(e, 'eb'), grev = total('rev'), rank = BIZ.slice().sort(function (a, c) { return (val(c.e, 'rev') || 0) - (val(a.e, 'rev') || 0); }).map(function (x) { return x.e; }).indexOf(e);
    var t = '';
    if (!rev && isNum(eb) && eb < 0) t = e + ' in ' + the(inf.country) + ' earns no revenue: ' + mshort(-eb) + ' of costs held centrally come off adjusted EBITDA.';
    else t = e + ' in ' + the(inf.country) + ': ' + mshort(rev) + ' of revenue, ' + pct(rev / (grev || 1), 0) + ' of the group' + (rank === 0 ? ', the largest business' : '') + '. Adjusted EBITDA ' + mshort(eb) + (rev ? ' (' + pct(eb / rev) + ' margin)' : '') + '.';
    var sch = Object.keys(S.schInfo).filter(function (s) { return S.schInfo[s].e === e; });
    if (sch.length) { var big = sch.slice().sort(function (a, c) { return ((S.sch[c] || {}).rev || 0) - ((S.sch[a] || {}).rev || 0); })[0], places = {}; sch.forEach(function (s) { places[S.schInfo[s].country] = 1; }); t += ' Runs ' + sch.length + ' scheme' + (sch.length > 1 ? 's' : '') + ' in ' + andList(Object.keys(places).map(function (p) { var g = geo(p); return g && g.t === 'world' ? 'worldwide' : g && g.t === 'region' ? 'across ' + p : the(p); })) + '; the largest is ' + big + ' at ' + mshort((S.sch[big] || {}).rev) + '.'; }
    var w = S.wfs[e] || {}, ret = Object.keys(w).filter(function (st) { return w[st] === 'Returned'; });
    if (ret.length) { var cm = ((S.wfc[e] || {})[ret[0]] || {}); t += ' Returned on ' + ret[0].replace(/^\d+\s*/, '') + (cm.r ? ': ' + cm.r : '.'); }
    else { var p = progOf(e); t += p === 1 ? ' Fully signed off.' : isNum(p) ? ' Sign-off ' + pct(p, 0) + ' complete.' : ''; }
    return t;
  }
  function the(n) { return /^(united|netherlands|czech|philippines|uk$|us$|usa$)/i.test(n || '') ? 'the ' + n : n; }
  function andList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  var tourT = null;
  function tourStart() { var k = S.measure; S.tourList = BIZ.filter(vis).slice().sort(function (a, b) { return Math.abs(val(b.e, k) || 0) - Math.abs(val(a.e, k) || 0); }).map(function (b) { return b.e; }); if (!S.tourList.length) return; S.tour = 0; tourGo(); }
  function tourGo() { var e = S.tourList[S.tour]; if (!e) { tourStop(); return; } select(e, true); if (tourT) clearTimeout(tourT); tourT = timer(function () { if (S.tour < 0) return; S.tour = (S.tour + 1) % S.tourList.length; tourGo(); }, 7000); }
  function tourStop() { S.tour = -1; if (tourT) clearTimeout(tourT); tourT = null; queueHud(); }

  // ---------- HUD (HTML around the globe) ----------
  function queueHud() { if (S.hudQ || disposed) return; S.hudQ = true; timer(function () { S.hudQ = false; renderHud(); }, 30); }
  function kpi(l, v, s) { return '<div class="kp"><span>' + esc(l) + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; }
  function renderHud() {
    var errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; });
    var h = '<header class="w-top"><div class="brand">' + BRAND.logo + '<span class="wm">' + esc(BRAND.name) + '</span><span class="sep"></span><div class="tt2"><b>' + esc(BRAND.title) + '</b><small>' + esc(BRAND.sub) + '</small></div></div>' +
      '<div class="pills">' + BRAND.pills.map(function (p, i) { return '<span class="pill' + (i ? ' ghost' : '') + '">' + esc(p) + '</span>'; }).join('') + '</div>' +
      '<div class="acts"><div class="seg">' + MEASURES.map(function (m) { return '<button data-measure="' + m.k + '" class="' + (S.measure === m.k ? 'on' : '') + '">' + esc(m.short) + '</button>'; }).join('') + '</div>' +
      '<button class="btn go" id="wTour">' + (S.tour >= 0 ? 'Stop tour' : '▶ Tour') + '</button></div></header>';
    if (!coreReady()) { h += '<div class="w-load"><span class="spin"></span>Loading the world from Pigment' + ELL + '</div>'; }
    else {
      var rev = total('rev'), eb = total('eb'), nC = Object.keys(CTRY).length;
      h += '<section class="w-kpis">' + kpi('Group revenue', mshort(rev), 'next 12 months') + kpi('Adjusted EBITDA', mshort(eb), pct(eb / (rev || 1)) + ' margin') +
        kpi('Countries', String(nC), Object.keys(CTRY).filter(function (k) { return CTRY[k].biz.length; }).length + ' with a business') + kpi('Businesses', String(BIZ.length), LOOPS.length + ' Loops') + kpi('Schemes', String(Object.keys(S.schInfo).length), (RINGS.length + ORBIT.length) ? (RINGS.length + ORBIT.length) + ' cross-border' : '') + '</section>';
      var mk = S.measure;
      h += '<div class="w-legend"><div class="lh">Loops <small>click to hide or show</small></div>' + LOOPS.map(function (L) {
        var t = 0; BIZ.forEach(function (b) { if (b.loop === L) { var v = val(b.e, mk); if (isNum(v)) t += mk === 'prog' ? 0 : v; } });
        return '<button class="lc' + (S.off[L] ? ' off' : '') + '" data-loop="' + esc(L) + '"><i style="background:' + LOOPCOL[L] + '"></i><span>' + esc(L) + '</span><b>' + (mk === 'prog' ? '' : mshort(t)) + '</b></button>';
      }).join('') + '<div class="key"><span><i class="k-col"></i>business</span><span><i class="k-pin"></i>scheme</span><span><i class="k-ring"></i>region</span><span><i class="k-orb"></i>worldwide</span><span><i class="k-arc"></i>from the hub</span></div>' +
        (UNMAPPED.length ? '<div class="unm">Not on the map: ' + esc(UNMAPPED.join(', ')) + '</div>' : '') + '</div>';
      h += '<div class="w-zoom"><button id="wZin" title="Zoom in">+</button><button id="wZout" title="Zoom out">−</button><button id="wHome" title="Back to the whole world">⌂</button></div>';
      if (!S.sel && S.tour < 0) h += '<div class="w-hint">Drag to turn the world · scroll to zoom · click a column</div>';
      if (S.sel) h += panel(S.sel);
      if (S.tour >= 0) { var te = S.tourList[S.tour]; h += '<div class="w-tour"><div class="tn">' + (S.tour + 1) + ' of ' + S.tourList.length + ' · ' + esc(te) + '</div><p>' + esc(caption(te)) + '</p><div class="tb"><button class="btn" id="wTPrev">‹ Back</button><button class="btn" id="wTStop">Stop</button><button class="btn go" id="wTNext">Next ›</button></div></div>'; }
      if (S.narrow && !S.sel && S.tour < 0) h += '<div class="w-list">' + BIZ.filter(vis).slice().sort(function (a, b) { return Math.abs(val(b.e, mk) || 0) - Math.abs(val(a.e, mk) || 0); }).map(function (b) { return '<button class="li" data-biz="' + esc(b.e) + '"><i style="background:' + b.col + '"></i><span>' + esc(b.e) + '<small>' + esc((S.entInfo[b.e] || {}).country || '') + '</small></span><b>' + fmtM(val(b.e, mk), mk) + '</b></button>'; }).join('') + '</div>';
    }
    if (errs.length) h += '<div class="w-errs">' + errs.map(esc).join('<br>') + '</div>';
    $('whud').innerHTML = h;
  }
  function panel(e) {
    var b = bizOf(e) || { col: C.cloud, loop: '' }, inf = S.entInfo[e] || {}, rev = val(e, 'rev'), gp = val(e, 'gp'), eb = val(e, 'eb');
    var lines = BRAND.plOrder.filter(function (l) { return isNum(pl(e, l)); }), mx = 0; lines.forEach(function (l) { mx = Math.max(mx, Math.abs(pl(e, l))); }); mx = mx || 1;
    var plh = lines.map(function (l) { var v = pl(e, l); return '<div class="pr' + (BRAND.subtotals[l] ? ' st' : '') + '"><span>' + esc(l) + '</span><i style="width:' + Math.round(Math.abs(v) / mx * 100) + '%;background:' + (v < 0 ? C.coral : b.col) + '"></i><b>' + mf(v) + '</b></div>'; }).join('');
    var sch = Object.keys(S.schInfo).filter(function (s) { return S.schInfo[s].e === e; }).sort(function (a, c) { return ((S.sch[c] || {}).rev || 0) - ((S.sch[a] || {}).rev || 0); });
    var schh = sch.map(function (s) { var v = S.sch[s] || {}, i = S.schInfo[s]; return '<div class="sr"><div><b>' + esc(s) + '</b><small>' + esc(i.country) + ' · ' + esc(i.stream || '') + '</small></div><span>' + mshort(v.rev) + '<small>GP ' + mshort(v.gp) + ' · ' + pct(isNum(v.rev) && v.rev ? v.gp / v.rev : null) + '</small></span></div>'; }).join('');
    var w = S.wfs[e] || {}, wc = S.wfc[e] || {};
    var wfh = S.stages.filter(function (st) { return w[st]; }).map(function (st) { var s = w[st], cm = wc[st] || {}, col = BRAND.status[s] || C.cloud; return '<div class="wr"><div class="wh"><span>' + esc(st.replace(/^\d+\s*/, '')) + '</span><em style="background:' + rgba(col, 0.2) + ';color:' + col + '">' + esc(s) + '</em></div>' + (s === 'Returned' && cm.r ? '<p class="ret">Returned: ' + esc(cm.r) + '</p>' : '') + (cm.c ? '<p>' + esc(cm.c) + '</p>' : '') + (cm.o ? '<small>Owner: ' + esc(cm.o) + '</small>' : '') + '</div>'; }).join('');
    var rate = S.fx[inf.cur], sym = CURSYM[inf.cur] || (inf.cur ? inf.cur + ' ' : '');
    return '<aside class="w-panel"><div class="ph"><span class="pd" style="background:' + b.col + '"></span><div><h2>' + esc(e) + '</h2><small>' + esc(b.loop) + ' · ' + esc(inf.country || '') + ' · ' + esc(inf.method || '') + '</small></div><button class="x" id="wClose" title="Close">✕</button></div>' +
      '<div class="pk"><div><span>Revenue</span><b>' + mshort(rev) + '</b></div><div><span>Gross profit</span><b>' + mshort(gp) + '</b><small>' + pct(isNum(rev) && rev ? gp / rev : null) + '</small></div><div><span>Adj. EBITDA</span><b' + (eb < 0 ? ' class="neg"' : '') + '>' + mshort(eb) + '</b><small>' + pct(isNum(rev) && rev ? eb / rev : null) + '</small></div></div>' +
      '<div class="lbl">Next 12 months P&amp;L</div>' + plh +
      (schh ? '<div class="lbl">Schemes</div>' + schh : '') +
      (wfh ? '<div class="lbl">Sign-off <small>' + pct(progOf(e), 0) + ' complete</small></div>' + wfh : '') +
      (inf.cur ? '<div class="lbl">Currency</div><div class="fx">Reports in <b>' + esc(inf.cur) + '</b>' + (inf.cur !== 'GBP' && isNum(rate) ? ' · plan rate <b>' + rate.toFixed(4) + '</b> ' + CUR + ' per ' + sym + '1' : '') + '</div>' : '') +
      '<div class="pn"><button class="btn" id="wPrevB">‹ Previous</button><button class="btn" id="wNextB">Next business ›</button></div></aside>';
  }
  function stepBiz(d) { var list = BIZ.filter(vis).slice().sort(function (a, b) { return Math.abs(val(b.e, S.measure) || 0) - Math.abs(val(a.e, S.measure) || 0); }).map(function (b) { return b.e; }); if (!list.length) return; var i = list.indexOf(S.sel); select(list[(i + d + list.length) % list.length]); }
  function onClick(e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || !root.contains(t)) return;
    var d = t.dataset; note();
    if (d.measure) { S.measure = d.measure; setHeights(); queueHud(); return; }
    if (d.loop != null) { S.off[d.loop] = !S.off[d.loop]; if (S.sel && S.off[(bizOf(S.sel) || {}).loop]) S.sel = null; queueHud(); return; }
    if (d.biz) { select(d.biz); return; }
    if (t.id === 'wTour') { if (S.tour >= 0) tourStop(); else tourStart(); return; }
    if (t.id === 'wTNext') { S.tour = (S.tour + 1) % S.tourList.length; tourGo(); return; }
    if (t.id === 'wTPrev') { S.tour = (S.tour - 1 + S.tourList.length) % S.tourList.length; tourGo(); return; }
    if (t.id === 'wTStop') { tourStop(); return; }
    if (t.id === 'wClose') { S.sel = null; queueHud(); return; }
    if (t.id === 'wNextB') { stepBiz(1); return; }
    if (t.id === 'wPrevB') { stepBiz(-1); return; }
    if (t.id === 'wZin') { VW.fly = null; VW.zoom = clamp(VW.zoom * 1.35, 0.6, 7); return; }
    if (t.id === 'wZout') { VW.fly = null; VW.zoom = clamp(VW.zoom / 1.35, 0.6, 7); return; }
    if (t.id === 'wHome') { S.sel = null; if (S.tour >= 0) tourStop(); flyTo(VIEW0.lon, VIEW0.lat, VIEW0.zoom, 1500); queueHud(); return; }
  }
  function onVis() { if (document.hidden) stop(); else { last = 0; start(); } }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.w-app{position:absolute;inset:0;background:' + C.space + ';color:' + C.text + ';font-family:' + FONT + ';font-size:13px;line-height:1.4;overflow:hidden;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}',
    '.w-app *{box-sizing:border-box}#wcv{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}#whud{position:absolute;inset:0;pointer-events:none}#whud > *{pointer-events:auto}',
    '.w-top{position:absolute;left:0;right:0;top:0;height:60px;display:flex;align-items:center;gap:18px;padding:0 22px;background:linear-gradient(180deg,rgba(1,70,100,0.92),rgba(1,70,100,0.55));border-bottom:1px solid rgba(143,211,228,0.18)}',
    '.brand{display:flex;align-items:center;gap:10px;min-width:0}.wm{font-weight:700;font-size:16px}.sep{width:1px;height:26px;background:rgba(255,255,255,.25)}.tt2{display:flex;flex-direction:column;min-width:0}.tt2 b{font-size:14px}.tt2 small{font-size:11px;color:' + C.mut + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pills{display:flex;gap:8px;flex:1;min-width:0;overflow:hidden}.pill{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.16);white-space:nowrap}.pill.ghost{background:none;border:1px solid rgba(255,255,255,.24);font-weight:500;color:rgba(255,255,255,.85)}',
    '.acts{display:flex;gap:10px;align-items:center;flex:none}.seg{display:flex;background:rgba(2,20,32,.6);border:1px solid rgba(143,211,228,.22);border-radius:10px;padding:3px}.seg button{border:0;background:none;color:' + C.mut + ';font:inherit;font-size:12px;font-weight:600;padding:6px 11px;border-radius:7px;cursor:pointer}.seg button:hover{color:#fff}.seg button.on{background:' + C.blue + ';color:#fff}',
    '.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(143,211,228,.3);background:rgba(2,20,32,.6);color:' + C.text + ';border-radius:10px;padding:7px 13px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}.btn:hover{border-color:' + C.green + '}.btn.go{background:' + C.green + ';border-color:' + C.green + ';color:#00344B}',
    '.w-kpis{position:absolute;left:22px;top:72px;display:flex;gap:10px;flex-wrap:wrap;right:22px}.kp{background:rgba(3,25,40,.72);border:1px solid rgba(143,211,228,.16);border-radius:12px;padding:8px 14px;min-width:132px;backdrop-filter:blur(6px)}.kp span{display:block;font-size:11px;color:' + C.mut + ';font-weight:600}.kp b{display:block;font-size:20px;font-weight:700;letter-spacing:-.01em}.kp small{font-size:11px;color:' + C.mut + '}',
    '.w-legend{position:absolute;left:22px;bottom:20px;width:280px;background:rgba(3,25,40,.78);border:1px solid rgba(143,211,228,.16);border-radius:14px;padding:12px;backdrop-filter:blur(6px)}.lh{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + C.mut + ';margin-bottom:6px}.lh small{text-transform:none;letter-spacing:0;font-weight:500;margin-left:4px}',
    '.lc{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;color:' + C.text + ';font:inherit;font-size:13px;padding:5px 6px;border-radius:8px;cursor:pointer;text-align:left}.lc:hover{background:rgba(143,211,228,.08)}.lc i{width:10px;height:10px;border-radius:3px;flex:none}.lc span{flex:1}.lc b{font-size:12px}.lc.off{opacity:.38}.lc.off i{background:transparent!important;border:1px solid ' + C.mut + '}',
    '.key{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(143,211,228,.12);font-size:11px;color:' + C.mut + '}.key span{display:inline-flex;align-items:center;gap:5px}.key i{display:inline-block}.k-col{width:5px;height:12px;border-radius:2px;background:' + C.green + '}.k-pin{width:7px;height:7px;border-radius:50%;background:' + C.sky + '}.k-ring{width:12px;height:8px;border:1px dashed ' + C.sky + ';border-radius:50%}.k-orb{width:12px;height:5px;border-top:1px dashed ' + C.mut + ';border-radius:50%}.k-arc{width:14px;height:6px;border-top:2px dashed ' + C.green + ';border-radius:50% 50% 0 0}',
    '.unm{margin-top:6px;font-size:11px;color:' + C.gold + '}',
    '.w-zoom{position:absolute;right:22px;bottom:20px;display:flex;flex-direction:column;gap:6px}.w-zoom button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(143,211,228,.25);background:rgba(3,25,40,.78);color:' + C.text + ';font:inherit;font-size:18px;cursor:pointer}.w-zoom button:hover{border-color:' + C.green + '}',
    '.w-hint{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font-size:12px;color:' + C.mut + ';background:rgba(3,25,40,.6);border-radius:999px;padding:6px 14px;pointer-events:none}',
    '.w-tour{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:min(640px,calc(100% - 640px));min-width:340px;background:rgba(3,25,40,.88);border:1px solid rgba(0,207,66,.45);border-radius:14px;padding:12px 16px;backdrop-filter:blur(6px)}.w-tour .tn{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + C.green + '}.w-tour p{margin:4px 0 10px;font-size:14px;line-height:1.5}.w-tour .tb{display:flex;gap:8px;justify-content:flex-end}',
    '.w-panel{position:absolute;right:16px;top:72px;bottom:16px;width:min(420px,36%);overflow:auto;background:rgba(3,25,40,.9);border:1px solid rgba(143,211,228,.2);border-radius:16px;padding:16px 18px;backdrop-filter:blur(8px);box-shadow:0 20px 60px rgba(0,0,0,.45)}',
    '.w-panel .ph{display:flex;gap:10px;align-items:flex-start}.pd{width:12px;height:12px;border-radius:4px;margin-top:7px;flex:none}.w-panel h2{margin:0;font-size:20px;font-weight:700}.w-panel .ph small{color:' + C.mut + ';font-size:12px}.w-panel .ph > div{flex:1}.x{border:1px solid rgba(143,211,228,.3);background:none;color:' + C.text + ';border-radius:8px;width:30px;height:30px;cursor:pointer;font:inherit}.x:hover{border-color:' + C.green + '}',
    '.pk{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 4px}.pk div{background:rgba(143,211,228,.07);border-radius:10px;padding:8px 10px}.pk span{display:block;font-size:11px;color:' + C.mut + ';font-weight:600}.pk b{display:block;font-size:17px}.pk small{font-size:11px;color:' + C.mut + '}.neg{color:' + C.coral + '}',
    '.lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + C.mut + ';margin:16px 0 6px}.lbl small{text-transform:none;letter-spacing:0;font-weight:600;color:' + C.green + ';margin-left:6px}',
    '.pr{display:grid;grid-template-columns:150px 1fr 112px;gap:8px;align-items:center;font-size:12px;padding:3px 0}.pr i{height:7px;border-radius:4px;display:block;min-width:2px}.pr b{text-align:right;font-weight:600}.pr.st{font-weight:700}.pr.st span{color:#fff}.pr span{color:' + C.mut + '}',
    '.sr{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(143,211,228,.1)}.sr b{font-size:13px;font-weight:600}.sr small{display:block;color:' + C.mut + ';font-size:11px}.sr > span{text-align:right;font-weight:700;white-space:nowrap}',
    '.wr{padding:8px 10px;border-radius:10px;background:rgba(143,211,228,.06);margin-bottom:6px}.wh{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:600;font-size:12px}.wh em{font-style:normal;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px}.wr p{margin:4px 0 0;font-size:12px;color:' + C.text + ';opacity:.85}.wr p.ret{color:' + C.coral + ';opacity:1;font-weight:600}.wr small{color:' + C.mut + ';font-size:11px}',
    '.fx{font-size:13px;color:' + C.mut + '}.fx b{color:' + C.text + '}.pn{display:flex;justify-content:space-between;margin-top:16px;gap:8px}',
    '.w-tip{position:fixed;display:none;z-index:20;pointer-events:none;background:rgba(2,18,30,.95);border:1px solid rgba(143,211,228,.25);border-radius:12px;padding:10px 12px;min-width:210px;max-width:320px;font-family:' + FONT + ';font-size:12px;color:' + C.text + ';box-shadow:0 12px 36px rgba(0,0,0,.5)}',
    '.w-tip .th{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:13px}.w-tip .tg{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px}.w-tip .ts{color:' + C.mut + ';font-size:11px;margin:2px 0 6px}.w-tip .tr{display:flex;justify-content:space-between;gap:12px;padding:2px 0}.w-tip .tr span{display:flex;align-items:center;gap:6px;color:' + C.mut + '}.w-tip .tr i{width:8px;height:8px;border-radius:2px;display:inline-block}.w-tip .tt{margin-top:6px;padding-top:6px;border-top:1px solid rgba(143,211,228,.15)}.w-tip .tf{margin-top:6px;font-size:11px;color:' + C.green + '}',
    '.w-load{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:12px;align-items:center;font-size:14px;color:' + C.mut + '}.spin{width:18px;height:18px;border-radius:50%;border:3px solid rgba(143,211,228,.25);border-top-color:' + C.green + ';animation:wsp 1s linear infinite;display:inline-block}@keyframes wsp{to{transform:rotate(360deg)}}',
    '.w-errs{position:absolute;left:22px;right:22px;top:132px;padding:8px 12px;background:rgba(229,72,77,.2);border:1px solid ' + C.coral + ';border-radius:10px;font-size:12px}',
    '.w-list{position:absolute;left:12px;right:12px;bottom:12px;top:calc(70px + 50vw * 0.5 + 16px);overflow:auto;display:flex;flex-direction:column;gap:6px}.li{display:flex;align-items:center;gap:10px;border:1px solid rgba(143,211,228,.18);background:rgba(3,25,40,.8);color:' + C.text + ';border-radius:10px;padding:8px 10px;font:inherit;text-align:left;cursor:pointer}.li i{width:10px;height:10px;border-radius:3px;flex:none}.li span{flex:1}.li small{display:block;color:' + C.mut + ';font-size:11px}',
    '@media (max-width:1180px){.pills{display:none}.tt2 small{display:none}}',
    '@media (max-width:699px){.w-top{height:auto;flex-wrap:wrap;padding:8px 12px;gap:8px}.acts{width:100%;justify-content:space-between}.w-kpis,.w-legend,.w-zoom,.w-hint{display:none}.w-panel{left:8px;right:8px;width:auto;top:auto;height:70%}.w-tour{left:8px;right:8px;transform:none;width:auto;min-width:0}}',
    '@media (prefers-reduced-motion:reduce){.spin{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  on(root, 'click', onClick);
  on(cv, 'pointerdown', onDown);
  on(window, 'pointermove', onMove);
  on(window, 'pointerup', onUp);
  on(window, 'pointercancel', onUp);
  on(cv, 'wheel', onWheel, { passive: false });
  on(cv, 'mouseleave', function () { S.hover = null; hideTip(); });
  on(document, 'keydown', onKey);
  on(document, 'visibilitychange', onVis);
  on(window, 'resize', function () { resize(); });

  root.__cleanup = function () {
    disposed = true; stop();
    timers.forEach(clearTimeout);
    Object.keys(subs).forEach(function (k) { try { subs[k] && subs[k].unsubscribe && subs[k].unsubscribe(); } catch (e) { } });
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    if (css.parentNode) css.parentNode.removeChild(css);
  };

  COARSE = buildDots(1.2); buildGrat(); buildStars();
  renderHud();
  start();
  if (!SDK) { S.errors.sdk = 'The Pigment SDK is not available.'; renderHud(); return; }
  startData();
})();
