import * as THREE from 'three';

/**
 * CircuitSpline: Mathematical closed-loop curve representation
 * with a genuine 3D Overpass (upper bridge at Y = +8.5m)
 * and Underpass (lower tunnel at Y = 0.0m) crossover.
 *
 * Route elements (counter-clockwise from bottom straight):
 * 1. Bottom Main Straight (Start & Finish Line at Y = 0)
 * 2. Sweeping right corner and outer straight
 * 3. Switchback chicanes
 * 4. OVERPASS INCLINE: Track climbs up onto an elevated bridge deck (Y = 1.5m -> 8.5m)
 * 5. OVERPASS BRIDGE: Crosses directly over the lower underpass below!
 * 6. BRIDGE DESCENT: Smooth slope back down to ground level (Y = 8.5m -> 0m)
 * 7. Far-left loop and hairpin turn
 * 8. UNDERPASS TUNNEL: Drives directly underneath the elevated overpass bridge!
 * 9. Return straight back to Start/Finish line
 */
export class CircuitSpline {
  constructor() {
    const rawPoints = [
      // 0-3: Bottom Main Straight (Start/Finish at z=-140, Y=0)
      new THREE.Vector3(-40, 0, -140),   // 0: Start line approach
      new THREE.Vector3(20,  0, -140),   // 1: Finish line gantry
      new THREE.Vector3(75,  0, -140),   // 2: End of straight
      new THREE.Vector3(125, 0, -110),   // 3: Bottom-right sweep

      // 4-7: Right Outer Section & Switchbacks (Y = 0)
      new THREE.Vector3(150, 0, -40),    // 4: Right outer turn
      new THREE.Vector3(150, 0, 35),     // 5: Right outer vertical
      new THREE.Vector3(130, 0, 95),     // 6: Top-right corner
      new THREE.Vector3(75,  0, 105),    // 7: Switchback entrance

      // 8-11: Right Inner Switchbacks
      new THREE.Vector3(35,  0, 75),     // 8: Switchback left
      new THREE.Vector3(75,  0, 40),     // 9: Switchback loop right
      new THREE.Vector3(110, 0, 10),     // 10: Switchback sweep
      new THREE.Vector3(75,  0, -25),    // 11: Switchback lower turn

      // 12-16: ELEVATED OVERPASS BRIDGE (Ascends to Y = 8.5m!)
      new THREE.Vector3(25,  2.0, -35),  // 12: Bridge ramp start
      new THREE.Vector3(10,  6.8, 0),    // 13: Bridge climb approach
      new THREE.Vector3(-15, 8.5, 45),   // 14: OVERPASS BRIDGE APEX (Crosses directly over point 21!)
      new THREE.Vector3(-35, 5.5, 85),   // 15: Bridge descent slope
      new THREE.Vector3(-55, 1.2, 115),  // 16: Ramp bottom landing

      // 17-20: Top Left Section (Y = 0)
      new THREE.Vector3(-80, 0, 95),     // 17: Back to ground level
      new THREE.Vector3(-115, 0, 105),   // 18: Far top-left corner
      new THREE.Vector3(-135, 0, 60),    // 19: Left vertical
      new THREE.Vector3(-120, 0, 0),     // 20: Left bottom sweep

      // 21-22: UNDERPASS SECTION (Passes directly beneath the Overpass at Y = 0!)
      new THREE.Vector3(-15, 0, 45),     // 21: UNDERPASS DIRECTLY UNDER OVERPASS (Point 14 is Y=8.5 above!)
      new THREE.Vector3(15,  0, 30),     // 22: Emerges from underpass

      // 23-26: Return Loop to Main Straight (Y = 0)
      new THREE.Vector3(-60, 0, -35),    // 23: Left chicane
      new THREE.Vector3(-125, 0, -40),   // 24: Outer left hairpin
      new THREE.Vector3(-130, 0, -85),   // 25: Outer left bottom corner
      new THREE.Vector3(-90,  0, -135)   // 26: Return to main straight
    ];

    // Closed Catmull-Rom spline
    this.curve = new THREE.CatmullRomCurve3(rawPoints, true, 'catmullrom', 0.5);
    this.totalLength = this.curve.getLength();
    this.rawPoints = rawPoints;
  }

  // Sample point on track given normalized distance t (0.0 to 1.0)
  getPointAt(t) {
    const wrapped = ((t % 1) + 1) % 1;
    return this.curve.getPointAt(wrapped);
  }

  // Sample forward tangent direction at distance t
  getTangentAt(t) {
    const wrapped = ((t % 1) + 1) % 1;
    return this.curve.getTangentAt(wrapped);
  }

  // Convert distance in meters along the circuit into normalized t
  distToT(dist) {
    return ((dist % this.totalLength) + this.totalLength) % this.totalLength / this.totalLength;
  }
}

export const circuitSpline = new CircuitSpline();
