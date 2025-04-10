/* Class that renders map and line graph that corresponds to map */
import LineChart from "../lineChart.js";

export class MapVisualization {
    lineChart;
    constructor(containerId, dataset, latestYear, initialMetric, metricOptions) {
        this.container = document.getElementById(containerId);
        this.dataset = dataset;
        this.latestYear = latestYear;
        this.metricOptions = metricOptions;
        this.metric = initialMetric; // Metric to visualize (e.g., "accid_adj_pc_km")
        this.height = window.innerHeight * 0.70;
        this.width = this.height*1.2;
        this.activeCountry = null; // Selected country
        this.defaultColor = "green"; // Default country color
        this.hoverColor = "#ffcc00"; // Hover color
        this.activeColor = "green"; // Selected country color
        this.noDataCountryColor= "#d3d3d3";
        this.lineChartBoolean = false;
        this.lineChart  = null;
        
        
    }

    //initialises map
    init() {
        this.createSvg();
        this.zoomAction();
        this.loadMapData();
        this.addSlider();
        this.updateColorScale();
        this.generateMetricSelector();
        this.addColorLegend();
        this.lineChartForMap('#line-graph-country');
        this.updateLineChart();
        this.updateTitle();
        
    }

    createSvg() {
        // Set up container dimensions
        this.updateDimensions();
    
        // Create the SVG
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .classed("responsive-svg", true);
    
        this.mapGroup = this.svg.append("g");
    
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "map_tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("display", "none")
            .style("z-index", 9999)
            .style("pointer-events", "none");
    
        // Attach resize listener
        window.addEventListener("resize", () => this.handleResize());
    }

    //Creates colour scale based on metric value
    updateColorScale(){
        this.colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([d3.min(this.dataset, d => d[this.metric]), d3.max(this.dataset, d => d[this.metric])]);
        this.svg.selectAll(".color-legend").remove();
        this.addColorLegend();
    }
    
    /*Getter and setter methods */
    //Updates map with selected metric
    setMetric(newMetric){
        this.metric = newMetric;
        this.updateColorScale();
        this.updateMap(d3.select("#year-slider").property("value"));
        this.updateLineChart();
        this.updateTitle();

    }

    getMetricLabel(metricKey) {
        const metric = this.metricOptions.find(m => m.key === metricKey);
        return metric ? metric.label : "Unknown Metric";
    }

    //Generates html dropdown
    generateMetricSelector() {
        const metricSelector = document.getElementById("metric-selector");

        //Loops through array to get dataset attribute and label
        this.metricOptions.forEach(metric=> {
            const option = document.createElement("option");
            option.value = metric.key;
            option.textContent = metric.label;
            metricSelector.appendChild(option);
        });

        metricSelector.value = this.metric;

        //event listener for changing metric
        metricSelector.addEventListener("change", (event) => {
            const selectedMetric = event.target.value;
            this.setMetric(selectedMetric)
        })

    }

    // Zoom and Pan interaction
    zoomAction() {
        this.zoom = d3.zoom()
            .scaleExtent([1, 4]) // Min zoom = 1x, Max zoom = 4x
            .translateExtent([[0, 0], [this.width, this.height]]) // Restrict panning
            .on("zoom", (event) => {
                this.mapGroup.attr("transform", event.transform);
            });

        this.svg.call(this.zoom);
    }

    //Gets map data
    loadMapData() {
        const projection = d3.geoMercator()
            .center([5, 55])
            .scale(this.height) //to account for different size screens
            .translate([this.width / 2, this.height / 2]);

        const path = d3.geoPath().projection(projection);
        d3.json("./scripts/map/europe.geojson").then(geoData => {
            this.renderMap(geoData, path);
        }).catch(error => {
            console.error("Error loading GeoJSON:", error);
        });
    }

    //Renders map visual
    renderMap(geoData, path) {
        //retrieved from EDA
        this.interactiveCountries = [
            'Austria', 'Belgium', 'Croatia', 'Czechia', 'Denmark', 'Estonia',
            'Finland', 'France', 'Germany', 'Ireland', 'Italy', 'Latvia',
            'Netherlands', 'Poland', 'Portugal', 'Slovakia', 'Slovenia',
            'Spain', 'Sweden', 'United Kingdom'
        ];

        this.mapGroup.selectAll("path")
            .data(geoData.features)
            .enter().append("path")
            .attr("class", "country-path") 
            .attr("d", path)
            .attr("fill", d => this.getCountryColor(d, this.latestYear)) // Initial year
            .attr("stroke", "black")
            .attr("stroke-width", 0.75)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d))
            .on("click", (event, d) => this.handleCountryClick(d));
    }

    //Changes colour when country is selected
    getCountryColor(d, year) {
        // Check if d or d.properties is null or undefined
        if (!d || !d.properties) {
            return this.noDataCountryColor; // Return a default color
        }
    
        // If the country is active, return the active color
        if (this.activeCountry === d.properties.NAME) {
            return this.activeColor;
        }
    
        // Otherwise, return the colour based on metric value
        const countryData = this.dataset.find(data => data.country === d.properties.NAME && data.year === +year);
        return countryData ? this.colorScale(countryData[this.metric]) : this.noDataCountryColor;
    }
    
    //update colour    
    updateMap(year) {
        this.mapGroup.selectAll(".country-path") // Only select map paths
            .attr("fill", d => this.getCountryColor(d, year));
    }

     // Generate year ticks for the slider
     generateYearTicks(minYear, maxYear) {
        const datalist = document.createElement("datalist");
        datalist.id = "year-ticks";

        for (let year = minYear; year <= maxYear; year++) {
            const option = document.createElement("option");
            option.value = year;
            option.label = year.toString();
            datalist.appendChild(option);
        }

        return datalist;
    }

    //Renders slider with years
    addSlider() {
        const slider = document.getElementById("year-slider");
        const yearValue = document.getElementById("year-value");

        // Set the slider's min, max, and initial value
        const minYear = 1998; // Replace with the minimum year in your dataset
        const maxYear = this.latestYear;
        slider.min = minYear;
        slider.max = maxYear;
        slider.value = maxYear;
        yearValue.textContent = maxYear;

        // Generate and append the year ticks
        const yearTicks = this.generateYearTicks(minYear, maxYear);
        slider.setAttribute("list", "year-ticks"); // Associate the datalist with the slider
        slider.parentElement.appendChild(yearTicks);

        // Add event listener for slider input
        slider.addEventListener("input", () => {
            const year = slider.value;
            yearValue.textContent = year; // Update the displayed year
            this.updateMap(year); // Update the map for the selected year
        });
    }

    //When mouse is hovering
    handleMouseOver(event, d) {
        if (this.interactiveCountries.includes(d.properties.NAME) && this.activeCountry !== d.properties.NAME) {
            d3.select(event.target).attr("fill", this.hoverColor);
        }

        if (this.interactiveCountries.includes(d.properties.NAME)) {
            const year = d3.select("#year-slider").property("value");
            const countryData = this.dataset.find(data => data.country === d.properties.NAME && data.year === +year);
            const value = countryData ? countryData[this.metric] : "N/A";
            const metricLabel = this.getMetricLabel(this.metric);
            this.tooltip.style("display", "block")
                .html(`<strong>${d.properties.NAME}</strong><br>${metricLabel}: ${value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        }
    }

    //When not hovering
    handleMouseOut(event, d) {
        if (this.interactiveCountries.includes(d.properties.NAME) && this.activeCountry !== d.properties.NAME) {
            d3.select(event.target).attr("fill", d => this.getCountryColor(d, d3.select("#year-slider").property("value")));
        }
        this.tooltip.style("display", "none");
    }

    //During country
    handleCountryClick(d) {
       
        if (!this.interactiveCountries.includes(d.properties.NAME)) return; //removes interaction for countries not in the dataset
        
        if (this.activeCountry === d.properties.NAME) {
            // Reset zoom and color
            this.activeCountry = null;
            this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
            d3.selectAll(".country-path").attr("fill", d => this.getCountryColor(d, d3.select("#year-slider").property("value")));
            document.getElementById("country-label").innerHTML = "Select a Country";
            console.log(this.activeCountry);
            this.lineChart.highlightCountry(null)
            return this.activeCountry;
        } else {
            // Zoom into the selected country
            this.activeCountry = d.properties.NAME;
            const countryData = this.dataset.filter(data => data.country === this.activeCountry && data[this.metric] !== undefined);
            document.getElementById("country-label").innerHTML = this.activeCountry;
            this.zoomToCountry(d);
            d3.selectAll(".country-path").attr("fill", d => this.getCountryColor(d, d3.select("#year-slider").property("value")));
            console.log(this.activeCountry);
            this.lineChart.highlightCountry(this.activeCountry);
            return this.activeCountry;
        }
    }
    //Animates zoom in, changes active country colour
    zoomToCountry(d) {
        const projection = d3.geoMercator()
            .center([5, 55])
            .scale(this.height)
            .translate([this.width / 2, this.height / 2]);

        const path = d3.geoPath().projection(projection);
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        const scale = Math.min(2.5, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height));
        const translateX = this.width / 2 - scale * (x0 + x1) / 2;
        const translateY = this.height / 2 - scale * (y0 + y1) / 2;

        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );


 
    }
    // Add a scale indicator to the map
    addColorLegend() {
        // Dimensions and position of the legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legendMargin = { top: 20, right: 20, bottom: 20, left: 20 };
    
        // Create a group for the legend
        const legendGroup = this.svg.append("g")
            .attr("class", "color-legend")
            .attr("transform", `translate(${legendMargin.left},${legendMargin.top})`);
    
        // Gradient for the legend
        const gradient = legendGroup.append("defs")
            .append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
    
        // Color stops for gradient
        const colorDomain = this.colorScale.domain();
        gradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => this.colorScale(colorDomain[0] + d * (colorDomain[1] - colorDomain[0])));
    
        // Gradient rectangle
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#color-gradient)")
            .style("stroke", "#000")
            .style("stroke-width", 1);
    
        // Add labels for the min and max values
        legendGroup.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 15)
            .text(colorDomain[0].toFixed(2)) // Min value
            .style("font-size", "12px")
            .style("fill", "#000");
    
        legendGroup.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 15)
            .text(colorDomain[1].toFixed(2)) // Max value
            .style("font-size", "12px")
            .style("fill", "#000")
            .style("text-anchor", "end");
    
    }
    
    lineChartForMap(div,width,height,margins){
        this.lineChart = new LineChart(div, width, height, margins);
        
    }

    updateLineChart(){
        this.lineChart.render(this.dataset,this.metric)
            .setLabels('Year', this.getMetricLabel(this.metric))
            .setTitle (this.getMetricLabel(this.metric)+' Over Time By Country ')
    }

    updateTitle() {
        const titleElement = document.getElementById("map-title");
        if (titleElement) {
            const metricLabel = this.getMetricLabel(this.metric);
            titleElement.textContent = `${metricLabel}`;
        }
    }

    updateDimensions() {
        const containerBounds = this.container.getBoundingClientRect();
        this.width = containerBounds.width;
        this.height = this.width / 1.2; // maintain aspect ratio
    }
    handleResize() {
        this.updateDimensions();
        this.svg
            .attr("viewBox", `0 0 ${this.width} ${this.height}`);
    
      
    }


}