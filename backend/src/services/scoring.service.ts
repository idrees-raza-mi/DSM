import User from '../models/User.model';
import Score from '../models/Score.model';
import {
  SCORE_NO_SHOW,
  SCORE_LATE_CANCEL,
  SCORE_COMPLETED,
  SCORE_MIN,
  SCORE_MAX,
  TIER_LIMITED_MIN,
} from '../utils/constants';

function clampScore(score: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, score));
}

async function applyScoreChange(
  driverId: string,
  delta: number,
  reason: 'no_show' | 'late_cancel' | 'completed' | 'admin_adjustment',
  bookingId?: string,
  note?: string
): Promise<{ scoreBefore: number; scoreAfter: number }> {
  const driver = await User.findById(driverId);
  if (!driver) throw new Error('Driver not found');

  const scoreBefore = driver.currentScore;
  const scoreAfter = clampScore(scoreBefore + delta);

  driver.currentScore = scoreAfter;

  // Auto-restrict if score drops below 60
  if (scoreAfter < TIER_LIMITED_MIN && driver.status === 'active') {
    driver.status = 'restricted';
  }

  await driver.save();

  await Score.create({
    driver: driverId,
    booking: bookingId || undefined,
    reason,
    delta,
    scoreBefore,
    scoreAfter,
    note,
  });

  return { scoreBefore, scoreAfter };
}

export async function applyNoShowPenalty(driverId: string, bookingId: string): Promise<void> {
  await applyScoreChange(driverId, SCORE_NO_SHOW, 'no_show', bookingId, 'No-show penalty');
}

export async function applyLateCancelPenalty(driverId: string, bookingId: string): Promise<void> {
  await applyScoreChange(driverId, SCORE_LATE_CANCEL, 'late_cancel', bookingId, 'Late cancellation penalty');
}

export async function applyCompletedBonus(driverId: string, bookingId: string): Promise<void> {
  await applyScoreChange(driverId, SCORE_COMPLETED, 'completed', bookingId, 'Mission completed bonus');
}

export async function getScoreHistory(driverId: string): Promise<any[]> {
  return Score.find({ driver: driverId }).sort({ createdAt: -1 }).limit(50).populate('booking');
}

export async function getDriverScore(driverId: string): Promise<{
  currentScore: number;
  tier: string;
  history: any[];
}> {
  const driver = await User.findById(driverId).select('currentScore');
  if (!driver) throw new Error('Driver not found');

  const history = await getScoreHistory(driverId);

  let tier = 'restricted';
  if (driver.currentScore >= 90) tier = 'priority';
  else if (driver.currentScore >= 70) tier = 'normal';
  else if (driver.currentScore >= 60) tier = 'limited';

  return { currentScore: driver.currentScore, tier, history };
}
