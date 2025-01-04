'use strict';

/**
 * Plot result from the beam analysis calculation into a graph
 */
class AnalysisPlotter {
    constructor(container) {
        this.container = document.getElementById(container).getContext('2d');
        this.title = this.getTitle(container); // Specify the chart title based on the container ID
    }

    /**
     * Specify the chart title based on the container ID.
     *
     * @param {string} container Canvas element ID
     * @returns {string} Chart title
     */
    getTitle(container) {
        switch (container) {
            case 'deflection_plot':
                return 'Deflection (mm)';
            case 'shear_force_plot':
                return 'Shear Force (kN)';
            case 'bending_moment_plot':
                return 'Bending Moment (kN-m)';
            default:
                return 'Plot';
        }
    }

    /**
     * Plot equation.
     *
     * @param {Object{beam : Beam, load : float, equation: Function}} data The equation data
     */
    plot(data) {
        console.log('Plotting data: ', data);

        

        // Creating data for graphs
        const xValues = [];
        const yValues = [];

        

        // Calculating x and y values for graphs
        if (data.beam.secondarySpan > 0) {  // Ensure that secondary span exists (for two span unequal condition)
            for (let x = 0; x <= (data.beam.primarySpan + data.beam.secondarySpan); x += 0.5) {
                let result = data.equation(x);
                xValues.push(result.x);
                yValues.push(result.y);
            }
        } else {
            // If only one span, the usual loop for simply supported
            for (let x = 0; x <= data.beam.primarySpan; x += 0.5) {
                let result = data.equation(x);
                xValues.push(result.x);
                yValues.push(result.y);
            }
        }
              

        // Creating charts with Chart.js
        this.chart = new Chart(this.container, {
            type: 'line', // Line chart type
            data: {
                labels: xValues, // X-axis value
                datasets: [{
                    label: null, // Does not display the label in the legend
                    data: yValues, // Y-axis value
                    fill: (this.title === 'Deflection (mm)') ? false : true, // Only for deflection, don't fill the area
                    backgroundColor: (this.title === 'Deflection (mm)') ? 'rgba(0, 0, 0, 0)' : 'rgba(169, 169, 169, 0.3)', // For deflection, no background color
                    borderColor: 'rgb(255, 0, 0)', // Red line color
                    borderWidth: 2, // Line width
                    tension: 0.0, // Set the line to be straight
                    pointRadius: 0 // Delete the circle on a data point
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: false // Does not display the title above the chart
                    },
                    legend: {
                        display: false // Does not display legend
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Span (m)'
                        },
                        min: 0,
                        max: data.beam.secondarySpan > 0 ? data.beam.primarySpan + data.beam.secondarySpan : data.beam.primarySpan  // Determining the maximum limit of the X-axis
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.title, // Title for Y-axis
                            align: 'center', // Centering the title on the Y-axis
                            position: 'left' // Placing the title on the left
                        },
                        ticks: {
                            beginAtZero: true, // Starting from scratch
                        }
                    }
                }
            }
        });
    }
    
}
