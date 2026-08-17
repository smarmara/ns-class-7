/**
 * Colours for the original sign artwork.
 *
 * These approximate the standard highway-sign colours described in the Traffic
 * Signs Regulations (N.S. Reg. 165/2012) and the Manual of Uniform Traffic
 * Control Devices for Canada that it adopts. The artwork is drawn from those
 * written specifications — it is not traced from Crown illustrations.
 */
export const SIGN = {
  red: '#c8102e',
  white: '#ffffff',
  black: '#16181d',
  /** Standard warning-sign yellow. */
  yellow: '#f7c600',
  /** Fluorescent yellow-green, used for school and pedestrian signs. */
  fluorGreen: '#c2e412',
  /** Temporary-condition (work zone) orange. */
  orange: '#f58220',
  /** Guide-sign green. */
  green: '#14683a',
  /** Information / accessibility blue. */
  blue: '#1b5ea8',
  /** Permissive green circle. */
  permitGreen: '#00843d',
} as const;
