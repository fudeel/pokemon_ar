<!-- C:\Users\fudeel\PycharmProjects\pokemon\FIX_MAP_CHECKLIST.md -->
# Fix Map Checklist

- [x] Verify starter Pokemon selection flow in `game-development-frontend`.
- [x] Fix "Choose pokemon" so the selected starter and player name persist in client memory across reloads/reconnects.
- [x] Verify client spawn generation uses real backend world data and zone Pokemon rates.
- [x] Verify random normal Pokemon are generated within the admin-created polygon spawn area.
- [x] Verify backend polygon persistence/processing shape matches what the client consumes.
- [x] Verify admin-created alive/server-controlled objects (items, rare Pokemon, NPCs, shops, gyms/events where present) still flow from backend API to the real user app.
- [x] Add or update focused tests/validation for persistence and polygon containment where the project supports it.
- [x] Run frontend/backend verification commands and record results.

Verification results:

- `npm run build` in `game-development-frontend`: passed.
- `python -m compileall app` in `backend`: passed.
