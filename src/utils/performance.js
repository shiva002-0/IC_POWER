/**
 * Olympus Performance & Adaptive Quality Architecture
 * Automatically adjusts pixel ratios, geometry budgets, and shadow resolutions
 * based on device capabilities and measured framerates.
 */

export const QUALITY_TIERS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export function detectDeviceTier() {
  if (typeof window === 'undefined') return QUALITY_TIERS.HIGH;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;

  if (isMobile || hardwareConcurrency <= 4 || deviceMemory <= 2) {
    return QUALITY_TIERS.LOW;
  }

  if (hardwareConcurrency <= 6 || deviceMemory <= 4) {
    return QUALITY_TIERS.MEDIUM;
  }

  return QUALITY_TIERS.HIGH;
}

export function getTierConfig(tier) {
  switch (tier) {
    case QUALITY_TIERS.LOW:
      return {
        tier: QUALITY_TIERS.LOW,
        label: 'Eco (Mobile/Low-Power)',
        dpr: [1, 1.0],
        shadowMapSize: 512,
        shadowsEnabled: false,
        oceanSegments: 72,
        serpentTubularSegments: 120,
        serpentRadialSegments: 16,
        mountainSegments: 36,
        cloudCountMultiplier: 0.45,
        targetFPS: 30
      };
    case QUALITY_TIERS.MEDIUM:
      return {
        tier: QUALITY_TIERS.MEDIUM,
        label: 'Balanced (Laptop)',
        dpr: [1, 1.25],
        shadowMapSize: 1024,
        shadowsEnabled: true,
        oceanSegments: 130,
        serpentTubularSegments: 180,
        serpentRadialSegments: 20,
        mountainSegments: 48,
        cloudCountMultiplier: 0.75,
        targetFPS: 60
      };
    case QUALITY_TIERS.HIGH:
    default:
      return {
        tier: QUALITY_TIERS.HIGH,
        label: 'Ultra (Desktop 60+ FPS)',
        dpr: [1, 1.6],
        shadowMapSize: 2048,
        shadowsEnabled: true,
        oceanSegments: 190,
        serpentTubularSegments: 240,
        serpentRadialSegments: 24,
        mountainSegments: 64,
        cloudCountMultiplier: 1.0,
        targetFPS: 60
      };
  }
}
