const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  username: { type: String, default: 'Anonymous' },
  sessionId: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  ending: {
    type: String,
    enum: ['wumpus_killed', 'escaped', 'became_wumpus', 'trapped', 'fell_pit', 'eaten', 'sanity_lost', null],
    default: null
  },
  stats: {
    roomsExplored: { type: Number, default: 0 },
    arrowsShot: { type: Number, default: 0 },
    arrowsHit: { type: Number, default: 0 },
    turnsPlayed: { type: Number, default: 0 },
    sanityAtEnd: { type: Number, default: 100 },
    powerupsCollected: { type: Number, default: 0 },
    loreFragmentsFound: { type: Number, default: 0 },
    corruptionLevel: { type: Number, default: 0 }
  },
  completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Calculate score before saving
GameSessionSchema.methods.calculateScore = function() {
  const s = this.stats;
  let score = 0;
  score += s.roomsExplored * 10;
  score += s.arrowsHit * 200;
  score -= s.arrowsShot * 20;
  score += s.loreFragmentsFound * 50;
  score += s.powerupsCollected * 30;
  score += Math.floor(s.sanityAtEnd * 2);

  const endingBonus = {
    wumpus_killed: 1000,
    escaped: 500,
    became_wumpus: 750,
    trapped: 0,
    fell_pit: 0,
    eaten: 0,
    sanity_lost: 0
  };
  if (this.ending && endingBonus[this.ending] !== undefined) {
    score += endingBonus[this.ending];
  }
  this.score = Math.max(0, score);
  return this.score;
};

module.exports = mongoose.model('GameSession', GameSessionSchema);
