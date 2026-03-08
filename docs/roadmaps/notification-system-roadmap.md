# Notification System Roadmap

## Near Term (1-2 Sprints)
- Finalize UI polish: validation for custom reminder input, inline error banner for permission denial, completion toast.
- Extend unit coverage: dispatchNotification edge cases, browser permission request fallbacks, Web Audio failure handling.
- Implement in-app notification center enhancements (filtering, bulk actions, read/unread sync).
- Wire email notification placeholders to actual backend API once available, including opt-in confirmation.

## Mid Term (Quarter)
- SMS provider integration (Twilio or internal gateway) behind feature flag with retry/backoff strategy.
- Notification analytics dashboard (delivery rate, response rate, quiet-hours usage) using existing reporting service.
- Admin policy management: organization-wide quiet hours, default reminder templates, escalation rules.
- Persisted notification audit trail with actor metadata and export functionality.

## Long Term
- Multi-channel orchestration: per-user preferences with priority-based channel fallback tree.
- ML-based reminder suggestions (learning from schedule patterns / delay history).
- Federation with partner systems for cross-project alerts (REST/webhook bridge).
- Disaster recovery playbooks: redundancy checks for notification workers and queued message replay.
