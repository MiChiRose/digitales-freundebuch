# Firebase Runtime Config

The app has safe built-in defaults. These Firestore documents are optional and
can be edited from the Firebase Console without publishing a new app build.

## `config/feature_flags`

```json
{
  "secret_chat_enabled": true,
  "local_cat_easter_egg_enabled": true,
  "seasonal_easter_egg": {
    "enabled": false,
    "id": "six_seven_2026",
    "value": "67",
    "trigger_tap_count": 7,
    "max_runs_per_day": 1,
    "duration_ms": 1800,
    "locales": ["de", "en", "ru"],
    "starts_at": "2026-06-01T00:00:00.000Z",
    "ends_at": "2026-09-01T00:00:00.000Z"
  }
}
```

Set `seasonal_easter_egg.enabled` to `true` to enable the animated number on
the home card. Set it back to `false` when the trend is over.

## `config/moderation`

```json
{
  "chat": {
    "enabled": true,
    "max_message_length": 300,
    "min_seconds_between_messages": 2,
    "repeat_block_threshold": 3,
    "repeated_block_ms": 60000,
    "blocked_window_ms": 120000
  },
  "filters": {
    "enabled": true,
    "block_urls": true,
    "block_emails": true,
    "block_phone_numbers": true,
    "blocked_terms": []
  }
}
```

`blocked_terms` can add extra words without rebuilding the app. Do not put
secrets here; clients can read runtime config.

## Deploying Rules

`firestore.rules` and `firebase.json` are included so the project can deploy
basic Firestore protections with Firebase CLI:

```sh
firebase deploy --only firestore:rules
```

Client-side moderation is a child-friendly UX guard. Firestore rules are the
minimum server-side guard. Stronger abuse prevention still needs backend logic
or Cloud Functions.
