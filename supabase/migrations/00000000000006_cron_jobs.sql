-- Jobs agendados via pg_cron.
--
-- pg_cron e pg_net já vêm habilitados em projetos Supabase.
-- Antes de aplicar em produção, configure no Dashboard ou via psql:
--
--   ALTER DATABASE postgres
--     SET app.settings.supabase_url    = 'https://<project-ref>.supabase.co';
--   ALTER DATABASE postgres
--     SET app.settings.service_role_key = '<service-role-key>';
--
-- Essas configurações são lidas em runtime pelo job de sync; sem elas o
-- net.http_post vai lançar "unrecognized configuration parameter".

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── sync-movies: 03:00 BRT = 06:00 UTC, todo dia ────────────────────────────
-- Remove job anterior se já existir (idempotente entre re-execuções da migration)

SELECT cron.unschedule(jobid)
FROM   cron.job
WHERE  jobname = 'sync-movies-03h-brt';

SELECT cron.schedule(
  'sync-movies-03h-brt',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.supabase_url') || '/functions/v1/sync-movies',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ─── cleanup-rate-limits: todo hora no minuto 0 ───────────────────────────────

SELECT cron.unschedule(jobid)
FROM   cron.job
WHERE  jobname = 'cleanup-rate-limits';

SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$ SELECT cleanup_rate_limits(); $$
);

-- ─── cleanup-sync-logs: 04:00 UTC todo dia ───────────────────────────────────

SELECT cron.unschedule(jobid)
FROM   cron.job
WHERE  jobname = 'cleanup-sync-logs';

SELECT cron.schedule(
  'cleanup-sync-logs',
  '0 4 * * *',
  $$ SELECT cleanup_sync_logs(); $$
);
