const path = require('path');
process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db');

(async () => {
  const { closeDb, getDb, syncPlanBreakfastTasksFromRecipes } = await import('../src/db.js');
  const { seedSharedRecipeLibrary } = await import('../src/seed/seedRecipes.js');
  closeDb();
  getDb();
  seedSharedRecipeLibrary();
  const n = syncPlanBreakfastTasksFromRecipes();
  const sample = getDb()
    .prepare(
      `SELECT title, template_key AS templateKey, substr(description, 1, 100) AS preview
       FROM tasks WHERE category = '早餐' AND date = '2026-07-15' LIMIT 1`
    )
    .get();
  const keys = getDb()
    .prepare(
      `SELECT template_key AS templateKey, COUNT(1) AS c
       FROM tasks WHERE category = '早餐'
       GROUP BY template_key ORDER BY c DESC LIMIT 10`
    )
    .all();
  console.log(JSON.stringify({ syncChanges: n, sample, keys }, null, 2));
  closeDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
