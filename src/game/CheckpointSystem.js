/**
 * CheckpointSystem.js - Ordered Checkpoint Validation,
 * Lap Timing, Anti-Shortcut Protection, and Accurate Position Calculation
 */

import * as THREE from 'three';

export class CheckpointSystem {
  constructor(trackMesh, totalLaps = 3) {
    this.trackMesh = trackMesh;
    this.checkpoints = trackMesh.checkpoints;
    this.totalLaps = totalLaps;
    this.checkpointCount = this.checkpoints.length;
  }

  /**
   * Check vehicle progress through checkpoints
   * @param {Vehicle} vehicle
   * @param {number} currentTime Elapsed race time in seconds
   * @returns {Object} { lapCompleted: boolean, raceCompleted: boolean, lapTime: number }
   */
  updateVehicle(vehicle, currentTime) {
    if (vehicle.isFinished) return { lapCompleted: false, raceCompleted: true };

    const nextIdx = (vehicle.currentCheckpoint + 1) % this.checkpointCount;
    const targetCP = this.checkpoints[nextIdx];

    const carPos = vehicle.position;
    const toCP = targetCP.position.clone().sub(carPos);
    const dist = toCP.length();

    // Check if car passed within checkpoint gate width
    if (dist < targetCP.width) {
      // Check plane crossing direction using checkpoint tangent
      const dot = toCP.dot(targetCP.tangent);
      if (dot <= 1.0) {
        // Successfully crossed checkpoint in sequence!
        vehicle.currentCheckpoint = nextIdx;

        // Finish line crossing
        if (nextIdx === 0) {
          const lapTime = currentTime - vehicle.currentLapStartTime;
          vehicle.lapTimes.push(lapTime);
          if (!vehicle.bestLapTime || lapTime < vehicle.bestLapTime) {
            vehicle.bestLapTime = lapTime;
          }
          vehicle.currentLapStartTime = currentTime;

          if (vehicle.currentLap >= this.totalLaps) {
            vehicle.isFinished = true;
            vehicle.totalRaceTime = currentTime;
            return { lapCompleted: true, raceCompleted: true, lapTime };
          } else {
            vehicle.currentLap += 1;
            return { lapCompleted: true, raceCompleted: false, lapTime };
          }
        }
      }
    }

    // Compute progress score for position tracking
    // Score = (Laps * 100000) + (CP * 1000) + distance fraction to next CP
    const nextNextIdx = (vehicle.currentCheckpoint + 1) % this.checkpointCount;
    const nextCP = this.checkpoints[nextNextIdx];
    const distToNext = vehicle.position.distanceTo(nextCP.position);
    const segmentLength = this.trackMesh.totalLength / this.checkpointCount;
    const fraction = Math.max(0, Math.min(1, 1 - (distToNext / segmentLength)));

    vehicle.raceProgressScore = (vehicle.currentLap * 100000) + (vehicle.currentCheckpoint * 1000) + fraction * 1000;

    return { lapCompleted: false, raceCompleted: false };
  }

  /**
   * Sort all vehicles and return positions [ { vehicle, pos, gap, isPlayer } ]
   */
  calculatePositions(vehicles, playerVehicle) {
    const sorted = [...vehicles].sort((a, b) => {
      // If someone finished, they rank by finish time
      if (a.isFinished && b.isFinished) {
        return a.totalRaceTime - b.totalRaceTime;
      }
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;
      return b.raceProgressScore - a.raceProgressScore;
    });

    const leader = sorted[0];
    return sorted.map((v, idx) => {
      const pos = idx + 1;
      let gap = 0;
      if (idx > 0) {
        if (v.isFinished && leader.isFinished) {
          gap = v.totalRaceTime - leader.totalRaceTime;
        } else {
          // Estimate time gap from score difference
          const scoreDiff = (leader.raceProgressScore - v.raceProgressScore) / 1000;
          gap = scoreDiff * 1.8;
        }
      }

      return {
        vehicle: v,
        pos,
        gap,
        isPlayer: v === playerVehicle,
        name: v.isPlayer ? 'Player' : (v.aiName || 'AI Racer'),
        carName: v.carConfig.name,
        totalTime: v.totalRaceTime || 0
      };
    });
  }
}
