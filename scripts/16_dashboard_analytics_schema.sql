-- 16_dashboard_analytics_schema.sql

-- Create a view to get job application stats per industry
CREATE OR REPLACE VIEW industry_job_stats AS
SELECT
  jp.industry_id,
  COUNT(ja.id) AS total_applications,
  COUNT(CASE WHEN ja.status = 'shortlisted' THEN 1 END) AS total_shortlisted,
  COUNT(CASE WHEN ja.status = 'reviewed' THEN 1 END) AS total_reviewed,
  (SELECT COUNT(*) FROM job_postings WHERE industry_id = jp.industry_id AND status = 'active') as active_jobs
FROM
  job_postings jp
LEFT JOIN
  job_applications ja ON jp.id = ja.job_id
GROUP BY
  jp.industry_id;

-- Create a view for recent activities
CREATE OR REPLACE VIEW industry_recent_activity AS
SELECT
  'application' as activity_type,
  ja.id,
  jp.industry_id,
  ja.student_name || ' applied for ' || jp.job_title as description,
  ja.applied_at as activity_date
FROM
  job_applications ja
JOIN
  job_postings jp ON ja.job_id = jp.id
UNION ALL
SELECT
  'test_submission' as activity_type,
  its.id,
  it.industry_id,
  its.student_name || ' submitted a test for ' || it.title as description,
  its.submitted_at as activity_date
FROM
  industry_test_submissions its
JOIN
  industry_tests it ON its.test_id = it.id
ORDER BY
  activity_date DESC;
