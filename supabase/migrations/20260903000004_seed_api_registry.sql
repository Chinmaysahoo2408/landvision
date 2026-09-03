-- 0004_seed_api_registry.sql
-- LandVision AI — seed the API & Government Gateway registry (§24).
--
-- This is platform METADATA describing endpoints and their integration status
-- — NOT fabricated project data. It stores status only, never credentials.
-- Government gateways that are not yet connected are marked
-- 'Planned Govt Gateway' so the API Center honestly shows they are not live.

insert into public.api_endpoints (method, path, description, category, status, params, response_sample)
values
  ('GET',  '/ml/health',                 'ML service health + loaded model summary',            'Risk & ML',   'Implemented',          '[]'::jsonb, '{}'::jsonb),
  ('POST', '/ml/dataset/validate',       'Validate an uploaded CSV/XLSX against §4 schema',      'Risk & ML',   'Implemented',          '["file"]'::jsonb, '{}'::jsonb),
  ('POST', '/ml/train',                  'Start a model training / retraining job',              'Risk & ML',   'Implemented',          '[]'::jsonb, '{}'::jsonb),
  ('GET',  '/ml/models',                 'List trained model versions + metrics',                'Risk & ML',   'Implemented',          '[]'::jsonb, '{}'::jsonb),
  ('POST', '/ml/predict',                'Predict delay + risk for a project record',            'Risk & ML',   'Implemented',          '["features"]'::jsonb, '{}'::jsonb),
  ('GET',  '/rest/v1/public_project_status', 'Public project status (read-only, anon)',          'Projects',    'Implemented',          '[]'::jsonb, '{}'::jsonb),
  ('GET',  '/rest/v1/public_delay_stats',    'Public aggregate delay statistics (anon)',         'Analytics',   'Implemented',          '[]'::jsonb, '{}'::jsonb),
  ('GET',  'https://bhoomirashi.gov.in (integration layer)', 'Authorized government land-records sync — connect when credentials are provisioned', 'Integrations', 'Planned Govt Gateway', '[]'::jsonb, '{}'::jsonb)
on conflict do nothing;
