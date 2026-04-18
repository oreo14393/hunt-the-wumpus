const express = require('express');
const GameSession = require('../models/GameSession');
const User = require('../models/User');
const router = express.Router();

// GET /api/leaderboard — top 20 scores
router.get('/', async (req, res) => {
  try {
    const { ending, limit = 20 } = req.query;
    const query = { completed: true };
    if (ending) query.ending = ending;

    const sessions = await GameSession.find(query)
      .sort({ score: -1 })
      .limit(parseInt(limit))
      .select('username score ending stats startedAt completedAt');

    res.json({ leaderboard: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const sessions = await GameSession.find({ userId: req.params.userId, completed: true })
      .sort({ score: -1 })
      .limit(10)
      .select('score ending stats startedAt completedAt');
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaderboard/submit — called when game ends
router.post('/submit', async (req, res) => {
  try {
    const { sessionId, userId, username, ending, stats } = req.body;

    let session = await GameSession.findOne({ sessionId });
    if (!session) {
      session = new GameSession({ sessionId, userId, username, ending, stats });
    } else {
      session.ending = ending;
      session.stats = stats;
      session.username = username;
    }
    session.completed = true;
    session.completedAt = new Date();
    session.calculateScore();
    await session.save();

    // Update user stats if authenticated
    if (userId) {
      const update = {
        $inc: {
          'stats.totalGames': 1,
          'stats.totalScore': session.score,
          'stats.totalArrowsShot': stats.arrowsShot || 0,
          'stats.totalRoomsExplored': stats.roomsExplored || 0,
        }
      };
      if (['wumpus_killed', 'escaped', 'became_wumpus'].includes(ending)) {
        update.$inc['stats.wins'] = 1;
        if (ending === 'wumpus_killed') update.$inc['stats.wumpusKills'] = 1;
        if (ending === 'became_wumpus') update.$inc['stats.corruptionEndings'] = 1;
        if (ending === 'escaped') update.$inc['stats.escapeEndings'] = 1;
      } else {
        update.$inc['stats.losses'] = 1;
      }

      const user = await User.findById(userId);
      if (user) {
        if (session.score > (user.stats.bestScore || 0)) {
          update.$set = { 'stats.bestScore': session.score };
        }
        await User.findByIdAndUpdate(userId, update);
      }
    }

    res.json({ score: session.score, rank: await getRank(session.score) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getRank(score) {
  const higher = await GameSession.countDocuments({ completed: true, score: { $gt: score } });
  return higher + 1;
}

module.exports = router;
