export default class LineChart {

    // Class-level variables
    container; width; height; margin;
    svg; chart; lines; axisX; axisY; labelX; labelY; title;
    scaleX; scaleY; colorScale;
    data; metric;
    highlightedCountry;
    tooltip;

    constructor(container) {
        // Select the container and create an SVG element
        this.container = d3.select(container);

        this.svg = this.container.append('svg')
            .classed('viz linechart', true)
            .style('width', '40vw')
            .style('height', 'auto')
            .attr('preserveAspectRatio', 'xMinYMin meet');

        // Append chart elements
        this.chart = this.svg.append('g');
        this.axisX = this.svg.append('g');
        this.axisY = this.svg.append('g');
        this.labelX = this.svg.append('text');
        this.labelY = this.svg.append('text');
        this.title = this.svg.append('text');

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        this.highlightedCountry = null;

        // Tooltip for displaying values
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "line_tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("display", "none")
            .style("z-index", 9999)
            .style("pointer-events", "none");

        // Initial rendering and resize listener
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Compute margins based on container width
    #computeResponsiveMargin() {
        const base = this.width;
        return [
            base * 0.05, // top
            base * 0.05, // bottom
            base * 0.08, // left
            base * 0.05  // right
        ];
    }

    // Adjust chart size based on viewport and re-render
    resize() {
        this.width = window.innerWidth * 0.5;
        this.height = this.width * 0.75;

        this.margin = this.#computeResponsiveMargin();
        this.svg.attr("viewBox", `0 0 ${this.width} ${this.height}`);

        if (this.data && this.metric) {
            this.#updateScales();
            this.#updateLines();
            this.#updateAxes();
            this.setLabels(this.labelX.text(), this.labelY.text());
            this.setTitle(this.title.text());
        }
    }

    // Update scales based on data and chart dimensions
    #updateScales() {
        let chartWidth = this.width - this.margin[2] - this.margin[3],
            chartHeight = this.height - this.margin[0] - this.margin[1];

        let domainX = d3.extent(this.data, d => d.year),
            domainY = [0, d3.max(this.data, d => d[this.metric])];

        this.scaleX = d3.scaleLinear(domainX, [0, chartWidth]);
        this.scaleY = d3.scaleLinear(domainY, [chartHeight, 0]).nice();

        this.chart.attr('transform', `translate(${this.margin[2]}, ${this.margin[0]})`);
        this.axisX.attr('transform', `translate(${this.margin[2]},${this.height - this.margin[1]})`);
        this.axisY.attr('transform', `translate(${this.margin[2]},${this.margin[0]})`);
    }

    // Draw and animate lines and nodes
    #updateLines() {
        const lineGenerator = d3.line()
            .x(d => this.scaleX(d.year))
            .y(d => this.scaleY(d[this.metric]));

        const countries = d3.groups(this.data, d => d.country);

        // Update lines with transitions
        this.lines = this.chart.selectAll('path.line')
            .data(countries, d => d[0])
            .join(
                enter => enter.append('path')
                    .classed('line', true)
                    .attr('fill', 'none')
                    .attr('stroke', d => this.colorScale(d[0]))
                    .attr('stroke-width', 1)
                    .attr('opacity', 0)
                    .attr('d', d => lineGenerator(d[1]))
                    .call(enter => enter.transition().duration(750)
                        .attr('opacity', d => (this.highlightedCountry && d[0] !== this.highlightedCountry) ? 0.3 : 1)
                        .attr('stroke-width', d => (this.highlightedCountry && d[0] === this.highlightedCountry) ? 3 : 1)
                    ),
                update => update.call(update => update.transition().duration(750)
                    .attr('d', d => lineGenerator(d[1]))
                    .attr('stroke', d => this.colorScale(d[0]))
                    .attr('stroke-width', d => (this.highlightedCountry && d[0] === this.highlightedCountry) ? 3 : 1)
                    .attr('opacity', d => (this.highlightedCountry && d[0] !== this.highlightedCountry) ? 0.3 : 1)
                ),
                exit => exit.call(exit => exit.transition().duration(500).attr('opacity', 0).remove())
            );

        // Update data point nodes with animation
        this.nodes = this.chart.selectAll('circle.node')
            .data(this.data, d => `${d.country}-${d.year}`)
            .join(
                enter => enter.append('circle')
                    .classed('node', true)
                    .attr('r', 0)
                    .attr('fill', d => this.colorScale(d.country))
                    .attr('cx', d => this.scaleX(d.year))
                    .attr('cy', d => this.scaleY(d[this.metric]))
                    .attr('opacity', d => (this.highlightedCountry && d.country !== this.highlightedCountry) ? 0.3 : 1)
                    .call(enter => enter.transition().duration(500).attr('r', 3)),
                update => update.call(update => update.transition().duration(500)
                    .attr('cx', d => this.scaleX(d.year))
                    .attr('cy', d => this.scaleY(d[this.metric]))
                    .attr('opacity', d => (this.highlightedCountry && d.country !== this.highlightedCountry) ? 0.3 : 1)
                ),
                exit => exit.call(exit => exit.transition().duration(300).attr('r', 0).remove())
            )
            .on('mouseover', (event, d) => this.handleNodeMouseOver(event, d))
            .on('mouseout', () => this.handleNodeMouseOut())
            .on('mousemove', (event) => this.handleNodeMouseMove(event));
    }

    // Update X and Y axes with animation
    #updateAxes() {
        let axisGenX = d3.axisBottom(this.scaleX)
            .tickValues([...new Set(this.data.map(d => d.year))])
            .tickFormat(d3.format('d'));

        let axisGenY = d3.axisLeft(this.scaleY);

        this.axisX.transition().duration(750).call(axisGenX);
        this.axisY.transition().duration(750).call(axisGenY);
    }

    // Render the chart with new data and metric
    render(dataset, metric) {
        this.data = dataset;
        this.metric = metric;
        this.resize();
        return this;
    }

    // Set axis labels
    setLabels(labelX = '', labelY = '') {
        this.labelX
            .attr('x', this.width / 2)
            .attr('y', this.height - 5)
            .style('text-anchor', 'middle')
            .text(labelX);

        this.labelY
            .attr('transform', `translate(15,${this.height / 2}) rotate(-90)`)
            .style('text-anchor', 'middle')
            .text(labelY);

        return this;
    }

    // Set chart title
    setTitle(title = '') {
        this.title
            .attr('x', this.width / 2)
            .attr('y', this.margin[0] / 2)
            .style('text-anchor', 'middle')
            .text(title);

        return this;
    }

    // Highlight a specific country's line and nodes
    highlightCountry(country) {
        this.highlightedCountry = country;
        this.#updateLines();
        return this;
    }

    // Tooltip interaction handlers
    handleNodeMouseOver(event, d) {
        this.tooltip.style("display", "block")
            .html(`<strong>${d.country}</strong><br>Year: ${d.year}<br>value: ${d[this.metric]}`);

        d3.select(event.target)
            .transition().duration(150)
            .attr('r', 5)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);
    }

    handleNodeMouseOut() {
        this.tooltip.style("display", "none");

        this.nodes.transition().duration(150)
            .attr('r', 3)
            .attr('stroke', null)
            .attr('stroke-width', null);
    }

    handleNodeMouseMove(event) {
        this.tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }
}