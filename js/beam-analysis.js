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

    calculateReactions(w, L1, L2) {
        const M1 = -(w * L1 ** 3 + w * L2 ** 3) / (8 * (L1 + L2));
        const R1 = M1 / L1 + (w * L1) / 2;
        const R3 = M1 / L2 + (w * L2) / 2;
        const R2 = w * (L1 + L2) - R1 - R3;

        return {
            M1: M1,
            R1: R1,
            R2: R2,
            R3: R3
        };
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
        return function (x) {
          const L = beam.primarySpan;
          const EI = beam.material.properties.EI/ 1e8;
          const w = load;
    
          // Updated deflection formula
          const delta =
            -((w * x) / (24 * EI)) *
            (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3)) *
            1000; // Convert to mm
 
          return { x: x, y: delta };
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
        const j2 = floatVal("j2");
        const L1 = beam.primarySpan; 
        const L2 = beam.secondarySpan; 
        const w = load; 
        const EI = beam.material.properties.EI / 1e7;

        const R1 = (w * L1 * (3 * L2 + 2 * L1)) / (2 * (L1 + L2));
        const R2 = w * (L1 + L2) - R1;

        let delta;

        // Condition L1 == L2
        if (L1 === L2) {
            if (x <= L1) {
                delta = ((w * x ** 2) / (24 * EI)) * (6 * L1 ** 2 - 4 * L1 * x + x ** 2) - (R1 * x ** 3) / (6 * EI);
            } else if (x <= L1 + L2) {
                const x2 = x - L1;
                delta = (w * L1 ** 3) / (6 * EI) - (R1 * L1 ** 2) / (2 * EI) + (R2 * x2 ** 3) / (6 * EI) - (w * x2 ** 4) / (24 * EI);
            }
        } else {
            // Condition L1!=L2
            if (x <= L1) {
                delta = ((w * x ** 2) / (24 * EI)) * (6 * L1 ** 2 - 4 * L1 * x + x ** 2) - (R1 * x ** 3) / (6 * EI);
            } else if (x <= L1 + L2) {
                const x2 = x - L1;
                delta = (w * L1 ** 3) / (6 * EI) - (R1 * L1 ** 2) / (2 * EI) + (R2 * x2 ** 3) / (6 * EI) - (w * x2 ** 4) / (24 * EI);
            }
        }

        return { x: x, y: delta * 1000 * j2 };
    };
}

    


    getBendingMomentEquation(beam, load) {
        return function(x) {
            const L1 = beam.primarySpan;
            const L2 = beam.secondarySpan;
            const w = load;
            const reactions = beam.calculateReactions(load, L1, L2);
            const R1 = reactions.R1;
            const R2 = reactions.R2;
    
            // Handles the condition when L1 == L2
            if (L1 === L2) {
                // Specific calculation model for L1 == L2
                if (x > L1 + L2) return { x, y: 0 };  // If x exceeds the total length
    
                let M = 0;
    
                // Bending moment at first span (0 to L1)
                if (x <= L1) {
                    M = R1 * x - (w * x ** 2) / 2;
                }
                // Bending moment at second span (L1 to L1+L2)
                else {
                    M = R1 * x + R2 * (x - L1) - (w * x ** 2) / 2;
                }
    
                return { x: x, y: M };
            }
    
            // Handle common conditions (L1!=L2)
            if (x > L1 + L2) return { x, y: 0 };  // Beyond total length
            
            let M = 0;
            
            // Bending moment at first span (0 to L1)
            if (x <= L1) {
                M = R1 * x - (w * x ** 2) / 2;
            }
            // Bending moment at second span (L1 to L1+L2)
            else {
                M = R1 * x + R2 * (x - L1) - (w * x ** 2) / 2;
            }
    
            return { x: x, y: M };
        };
    }
    
    getShearForceEquation(beam, load) {
        return function(x) {
            const L1 = beam.primarySpan;
            const L2 = beam.secondarySpan;
            const w = load;
            const reactions = beam.calculateReactions(w, L1, L2);
            const R1 = reactions.R1;
            const R2 = reactions.R2;
            const R3 = reactions.R3;
    
            let V;
    
            // Handles the condition when L1 == L2
            if (L1 === L2) {
                if (x > L1 + L2) return { x, y: 0 };  // If x exceeds the total length
                if (x <= L1) {
                    V = R1 - (w * x);  // Shear force between 0 and L1
                } else {
                    V = R1 + R2 - (w * x);  // Shear force between L1 to L1+L2
                }
                return { x: x, y: V };  // Restoring shear force
            }
    
            // Handle common conditions (L1!=L2)
            if (x === 0) {
                V = R1;  // Shear force at the start
            } else if (x < L1) {
                V = R1 - (w * x);  // Between 0 and L1
            } else if (x === L1) {
                V = R1 - w * L1;  // At the end of the first span
            } else if (x < L1 + L2) {
                V = R1 + R2 - (w * x);  // Between L1 and L1+L2
            } else if (x === L1 + L2) {
                V = R1 + R2 - (w * (L1 + L2));  // At the end of the second span
            }
    
            return { x: x, y: V };  // Returning shear force value
        };
    }
    
};
