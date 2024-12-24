'use strict';

/** ============================ Beam Analysis Data Type ============================ */

/**
 * Beam material specification.
 *
 * @param {String} name         Material name
 * @param {Object} properties   Material properties {EI : 0, GA : 0, ....}
 */
class Material {
    constructor(name, properties) {
        this.name = name;
        this.properties = properties;
    }
}

/**
 *
 * @param {Number} primarySpan          Beam primary span length
 * @param {Number} secondarySpan        Beam secondary span length
 * @param {Material} material           Beam material object
 */
class Beam {
    constructor(primarySpan, secondarySpan, material) {
        this.primarySpan = primarySpan;
        this.secondarySpan = secondarySpan;
        this.material = material;
    }
}

/** ============================ Beam Analysis Class ============================ */

class BeamAnalysis {
    constructor() {
        this.options = {
            condition: 'simply-supported'
        };

        this.analyzer = {
            'simply-supported': new BeamAnalysis.analyzer.simplySupported(),
            'two-span-unequal': new BeamAnalysis.analyzer.twoSpanUnequal()
        };
    }
    /**
     *
     * @param {Beam} beam
     * @param {Number} load
     */
    getDeflection(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getDeflectionEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }

    getBendingMoment(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getBendingMomentEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }

    getShearForce(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getShearForceEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
}




/** ============================ Beam Analysis Analyzer ============================ */

/**
 * Available analyzers for different conditions
 */
BeamAnalysis.analyzer = {};

/**
 * Calculate deflection, bending stress and shear stress for a simply supported beam
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.simplySupported = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }

    getDeflectionEquation(beam, load) {
        const j2 = floatVal("j2");  // Get the j2 value from the input
        return function(x) {
            const L = beam.primarySpan;
            const EI = beam.material.properties.EI;
            const w = load;
            const delta = (w * x * x * (3 * L - x)) / (6 * EI);  // Deflection formula
            return { x: x, y: delta * 1000 * j2 };  // Convert to mm and multiply by j2
        };
    }

    getBendingMomentEquation(beam, load) {
        return function(x) {
            const L = beam.primarySpan;
            const w = load;
            const M = (w * x * (L - x)) / 2;  // Bending moment
            return { x: x, y: M };  // Returns bending moment value
        };
    }
    

    getShearForceEquation(beam, load) {
        return function(x) {
            const L = beam.primarySpan;
            const w = load;
            const V = w * (L / 2 - x);  // Shear force
            return { x: x, y: V };  // Returns the shear force value
        };
    }
    
    
};


/**
 * Calculate deflection, bending stress and shear stress for a beam with two spans of equal condition
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.twoSpanUnequal = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }


    getDeflectionEquation(beam, load) {
        return function(x) {
            const EI = beam.material.properties.EI / 1e9; // Convert EI to kN-m^2
            const w = load;
            const L1 = beam.primarySpan;
            const L2 = beam.secondarySpan;
            const R1 = (w * L2 * (3 * L1 + L2)) / (8 * (L1 + L2)); // Reaction at support 1
            const R2 = (w * L1 * (3 * L2 + L1)) / (8 * (L1 + L2)); // Reaction at support 2

            let delta;

            if (x <= L1) {
                delta = ((R1 * Math.pow(x, 3)) / 6 - (w * Math.pow(x, 4)) / 24 + w * Math.pow(L1, 3) * x / 6) / EI; // Span 1
            } else if (x <= L1 + L2) {
                const xRel = x - L1;
                delta = ((R2 * Math.pow(xRel, 3)) / 6 - (w * Math.pow(xRel, 4)) / 24 + w * Math.pow(L2, 3) * xRel / 6) / EI; // Span 2
            } else {
                delta = 0;
            }

            return { x: x, y: delta * 1000 };
        };
    }

    getBendingMomentEquation(beam, load) {
        return function (x) {
            const L1 = beam.primarySpan;
            const L2 = beam.secondarySpan;
            const w = load;
            const R1 = (w * L2 * (3 * L1 + L2)) / (8 * (L1 + L2));

            let M;

            if (x <= L1) {
                M = R1 * x - (w * Math.pow(x, 2)) / 2; // Span 1
            } else if (x <= L1 + L2) {
                const xRel = x - L1;
                M = R1 * L1 - (w * Math.pow(xRel, 2)) / 2; // Span 2
            } else {
                M = 0;
            }
            return { x: x, y: M }; // Placeholder, implement actual formula
        };
    }

    getShearForceEquation(beam, load) {
        return function (x) {
            const L1 = beam.primarySpan;
            const L2 = beam.secondarySpan;
            const w = load;
            const R1 = (w * L2 * (3 * L1 + L2)) / (8 * (L1 + L2));

            let V;

            if (x <= L1) {
                V = R1 - w * x; // Span 1
            } else if (x <= L1 + L2) {
                const xRel = x - L1;
                V = R1 - w * xRel; // Span 2
            } else {
                V = 0;
            }
            
            return { x: x, y: V }; // Placeholder, implement actual formula
        };
    }
};
