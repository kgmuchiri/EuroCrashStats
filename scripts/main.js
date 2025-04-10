import { MapVisualization } from "./map/mapScript.js";
import LineChart from "./lineChart.js";
// Explicitly define window.map to avoid errors


let dataset = [];

d3.csv("dataset/europe_dataset.csv").then(data => {
    data.forEach(d => {
        d.year = +d.year;
        d.fatal_pc_km = +d.fatal_pc_km;
        d.fatal_mIn = +d.fatal_mIn;
        d.accid_adj_pc_km = +d.accid_adj_pc_km;
        d.p_km = +d.p_km;
        d.croad_inv_km = +d.croad_inv_km;
        d.croad_maint_km = +d.croad_maint_km;
        d.prop_motorwa = +d.prop_motorwa;
        d.populat = +d.populat;
        d.unemploy = +d.unemploy;
        d.petrol_car = +d.petrol_car;
        d.alcohol = +d.alcohol;
        d.mot_index_1000 = +d.mot_index_1000;
        d.den_populat = +d.den_populat;
        d.cgdp = +d.cgdp;
        d.cgdp_cap = +d.cgdp_cap;
        d.precipit = +d.precipit;
        d.prop_elder = +d.prop_elder;
        d.dps = +d.dps;
        d.freight = +d.freight;
        d.total_fatalities = +d.total_fatalities;
        d.total_accidents = +d.total_accidents;
        d.fatal_index_1000 = +d.fatal_index_1000;
    });

    dataset = data;
    console.log("Dataset loaded:", dataset);

    // Determine the latest year
    const latestYear = d3.max(dataset, d => d.year);
    console.log("Latest year:", latestYear);


    /* Map Visualisation
    Map filtering and slider
    */
    // Initialize map after dataset is ready
    const metricOptions = [
        { key: "accid_adj_pc_km", label: "Accidents (per billion passenger-km)" },
        { key: "fatal_pc_km", label: "Fatalities (per billion passenger-km)" },
        { key: "total_fatalities", label: "Total Fatalities" },
        { key: "total_accidents", label: "Total Accidents" },
        { key: "fatal_index_1000", label: "Fatalites per 1000 accidents" }
    ];
    const mapInstance = new MapVisualization("map-container", dataset, latestYear, "accid_adj_pc_km", metricOptions);
    mapInstance.init();
    window.mapInstance = mapInstance;


    /* const lineChart = new LineChart('#line-graph-country', 800, 500, [50, 50, 50, 50]);
     lineChart.render(data, 'fatal_pc_km')
         .setLabels('Year', 'Fatalities per 1000 accidents')
         .setTitle('Fatalities per 1000 km Over Time by Country')
         .highlightCountry("Portugal");*/

}).catch(error => {
    console.error("Error loading CSV:", error);
});